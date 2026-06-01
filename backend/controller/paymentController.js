const Payment = require("../model/Payment");
const Contract = require("../model/Contract");
const Task = require("../model/task");
const User = require("../model/user");
const Wallet = require("../model/Wallet");
const Transaction = require("../model/Transaction");

class PaymentController {
  constructor() {
    this.PLATFORM_FEE_PERCENTAGE = 5;
  }

  getNotificationService(req) {
    try {
      return req?.app?.get("notificationService") || null;
    } catch (error) {
      return null;
    }
  }

  // ==================== WALLET MANAGEMENT ====================

  async getOrCreateWallet(userId) {
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = new Wallet({
        userId,
        balance: 0,
        lockedBalance: 0,
        totalDeposited: 0,
        totalWithdrawn: 0,
        totalReceived: 0,
      });
      await wallet.save();
    }
    return wallet;
  }

  async getWallet(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const wallet = await this.getOrCreateWallet(userId);

      const transactions = await Transaction.find({
        $or: [{ fromUserId: userId }, { toUserId: userId }],
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("fromUserId", "fullName email")
        .populate("toUserId", "fullName email");

      const totalTransactions = await Transaction.countDocuments({
        $or: [{ fromUserId: userId }, { toUserId: userId }],
      });

      res.json({
        success: true,
        data: {
          wallet,
          transactions,
          availableBalance: wallet.balance,
          lockedBalance: wallet.lockedBalance,
          totalBalance: wallet.balance + wallet.lockedBalance,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalTransactions,
            pages: Math.ceil(totalTransactions / parseInt(limit)),
          },
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== COMPANY DEPOSIT ====================

  async depositMoney(req, res) {
    try {
      const { amount, paymentMethodId } = req.body; // Amount in USD
      const companyId = req.user.id;

      if (amount < 10) {
        return res.status(400).json({ error: "Minimum deposit is $10" });
      }

      const stripeService = require("../services/stripeService");
      // Use paymentMethodId to confirm the payment
      const paymentIntent = await stripeService.createPaymentIntent(amount, "usd", {
        metadata: { companyId, type: "wallet_deposit" },
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      });

      const transaction = new Transaction({
        fromUserId: companyId,
        toUserId: companyId,
        amount,
        type: "deposit",
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
        paymentMethod: "stripe",
        description: `Wallet deposit of $${amount.toLocaleString()}`,
        gateway: {
          name: "stripe",
          paymentIntentId: paymentIntent.id,
          currency: "USD",
          gatewayAmount: amount,
        },
      });
      await transaction.save();

      if (paymentIntent.status === 'succeeded') {
        // Credit wallet directly if succeeded
        await Wallet.findOneAndUpdate(
            { userId: companyId },
            { 
              $inc: { balance: amount, totalDeposited: amount },
              $set: { lastTransactionAt: new Date() }
            },
            { upsert: true }
        );
      }

      res.json({
        success: true,
        message: paymentIntent.status === 'succeeded' ? "Deposit successful" : "Deposit initiated",
        data: {
          status: paymentIntent.status,
          transactionId: transaction._id,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== STRIPE WEBHOOK ====================

  async handleWebhook(req, res) {
    const sig = req.headers["stripe-signature"];
    const stripeService = require("../services/stripeService");
    let event;

    try {
      event = stripeService.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const { companyId, type } = paymentIntent.metadata;

      if (type === "wallet_deposit") {
        const depositAmount = paymentIntent.amount / 100;

        try {
          // Update transaction
          const transaction = await Transaction.findOneAndUpdate(
            { "gateway.paymentIntentId": paymentIntent.id },
            { status: "completed", completedAt: new Date(), amount: depositAmount },
            { new: true }
          );

          if (transaction) {
            // Credit wallet
            await Wallet.findOneAndUpdate(
              { userId: companyId },
              { 
                $inc: { balance: depositAmount, totalDeposited: depositAmount },
                $set: { lastTransactionAt: new Date() }
              },
              { upsert: true }
            );
            console.log(`Successfully deposited $${depositAmount} to wallet ${companyId}`);
          }
        } catch (error) {
          console.error("Error processing deposit webhook:", error);
        }
      }
    }

    res.json({ received: true });
  }

  // ==================== MAKE PAYMENT ====================

  async makePayment(req, res) {
    try {
      const { contractId, amount, paymentType, milestoneId, notes } = req.body;
      const companyId = req.user.id;

      const contract = await Contract.findById(contractId)
        .populate("taskId")
        .populate("vendorId");

      if (!contract) return res.status(404).json({ error: "Contract not found" });
      if (contract.companyId.toString() !== companyId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const remainingAmount = contract.totalBudget - (contract.totalPaid || 0);
      if (amount <= 0 || amount > remainingAmount) {
        return res.status(400).json({
          error: `Invalid amount. Maximum allowed: ${remainingAmount}`,
        });
      }

      // ATOMIC CHECK AND UPDATE
      const companyWallet = await Wallet.findOneAndUpdate(
        { userId: companyId, balance: { $gte: amount } },
        {
          $inc: { balance: -amount, lockedBalance: amount },
          $set: { lastTransactionAt: new Date() },
        },
        { new: true }
      );

      if (!companyWallet) {
        return res.status(400).json({
          error: "Insufficient wallet balance or wallet not found",
        });
      }

      const platformFee = (amount * this.PLATFORM_FEE_PERCENTAGE) / 100;
      const vendorAmount = amount - platformFee;

      const payment = new Payment({
        taskId: contract.taskId._id,
        contractId: contract._id,
        companyId: contract.companyId,
        vendorId: contract.vendorId._id,
        amount,
        originalAmount: contract.totalBudget,
        platformFee,
        vendorAmount,
        paymentType: paymentType || "full",
        milestoneId,
        status: "completed",
        notes,
        createdBy: companyId,
        paymentDate: new Date(),
      });
      await payment.save();

      // Update vendor wallet atomically
      const vendorWallet = await Wallet.findOneAndUpdate(
        { userId: contract.vendorId._id },
        {
          $inc: { lockedBalance: vendorAmount },
          $set: { lastTransactionAt: new Date() },
        },
        { new: true, upsert: true }
      );

      // Create transaction
      const transaction = new Transaction({
        fromUserId: companyId,
        toUserId: contract.vendorId._id,
        amount,
        platformFee,
        netAmount: vendorAmount,
        type: "payment",
        status: "completed",
        paymentMethod: "wallet_balance",
        taskId: contract.taskId._id,
        contractId: contract._id,
        paymentId: payment._id,
        description: `Payment for ${contract.title}`,
        completedAt: new Date(),
        fromBalanceAfter: companyWallet.balance,
        toBalanceAfter: vendorWallet.balance + vendorWallet.lockedBalance,
      });
      await transaction.save();

      // Update contract
      contract.totalPaid = (contract.totalPaid || 0) + amount;
      contract.remainingAmount = contract.totalBudget - contract.totalPaid;
      contract.payments = contract.payments || [];
      contract.payments.push(payment._id);
      if (contract.totalPaid >= contract.totalBudget) {
        contract.paymentStatus = "paid";
      }
      await contract.save();

      payment.transactionId = transaction._id;
      await payment.save();

      // Send notification
      const notificationService = this.getNotificationService(req);
      if (notificationService) {
        try {
          await notificationService.createNotification({
            recipientId: contract.vendorId._id,
            type: "payment_received",
            title: "Payment Received",
            message: `You received $${vendorAmount} for ${contract.title}`,
            data: { paymentId: payment._id, amount: vendorAmount },
            relatedId: payment._id,
            relatedModel: "Payment",
          });
        } catch (e) { /* Ignore notification errors */ }
      }

      res.json({
        success: true,
        message: "Payment completed successfully",
        data: { payment, transaction, companyBalance: companyWallet.balance },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== CONFIRM PAYMENT ====================

  async confirmPayment(req, res) {
    try {
      const { paymentId } = req.params;
      const vendorId = req.user.id;

      const payment = await Payment.findById(paymentId);
      if (!payment) return res.status(404).json({ error: "Payment not found" });
      if (payment.vendorId.toString() !== vendorId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      if (payment.vendorConfirmed) {
        return res.status(400).json({ error: "Payment already confirmed" });
      }

      // ATOMIC WALLET UPDATES
      const vendorWallet = await Wallet.findOneAndUpdate(
        { userId: vendorId, lockedBalance: { $gte: payment.vendorAmount } },
        {
          $inc: { lockedBalance: -payment.vendorAmount, balance: payment.vendorAmount, totalReceived: payment.vendorAmount },
          $set: { lastTransactionAt: new Date() }
        },
        { new: true }
      );

      if (!vendorWallet) {
        return res.status(400).json({ error: "Insufficient locked balance in vendor wallet" });
      }

      await Wallet.findOneAndUpdate(
        { userId: payment.companyId, lockedBalance: { $gte: payment.amount } },
        { $inc: { lockedBalance: -payment.amount } }
      );

      // Credit platform fee to admin wallet
      if (payment.platformFee > 0) {
        try {
          const admin = await User.findOne({ role: "admin" });
          if (admin) {
            await Wallet.findOneAndUpdate(
              { userId: admin._id },
              { 
                $inc: { balance: payment.platformFee, totalReceived: payment.platformFee },
                $set: { lastTransactionAt: new Date() }
              },
              { upsert: true }
            );
            
            // Create transaction for platform fee
            const feeTransaction = new Transaction({
              fromUserId: payment.companyId,
              toUserId: admin._id,
              amount: payment.platformFee,
              type: "platform_fee",
              status: "completed",
              description: `Platform fee for payment ${payment.invoiceNumber}`,
              paymentId: payment._id,
              completedAt: new Date(),
            });
            await feeTransaction.save();
          }
        } catch (error) {
          console.error("Error crediting platform fee:", error);
        }
      }

      payment.vendorConfirmed = true;
      payment.vendorConfirmedAt = new Date();
      await payment.save();

      res.json({
        success: true,
        message: "Payment confirmed",
        data: { newBalance: vendorWallet.balance },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== REQUEST WITHDRAWAL ====================

  async requestWithdrawal(req, res) {
    try {
      const { amount, paymentMethod, accountDetails } = req.body;
      const vendorId = req.user.id;

      if (amount < 5) {
        return res.status(400).json({ error: "Minimum withdrawal is $5" });
      }

      // ATOMIC WALLET UPDATE
      const wallet = await Wallet.findOneAndUpdate(
        { userId: vendorId, balance: { $gte: amount } },
        { $inc: { balance: -amount, lockedBalance: amount } },
        { new: true }
      );

      if (!wallet) {
        return res.status(400).json({
          error: "Insufficient balance",
        });
      }

      const transaction = new Transaction({
        fromUserId: vendorId,
        toUserId: vendorId,
        amount,
        type: "withdrawal",
        status: "pending",
        paymentMethod,
        description: `Withdrawal of $${amount}`,
        withdrawalDetails: accountDetails,
      });
      await transaction.save();

      res.json({
        success: true,
        message: "Withdrawal request submitted",
        data: { transaction, remainingBalance: wallet.balance },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== GET COMPANY ACTIVE TASKS ====================

  async getCompanyActiveTasks(req, res) {
    try {
      const companyId = req.user.id;

      const contracts = await Contract.find({
        companyId: companyId,
        status: { $in: ["active", "in-progress", "pending-vendor"] },
      })
        .populate("taskId", "title description category budget")
        .populate("vendorId", "fullName companyName email")
        .lean();

      if (!contracts.length) {
        return res.json({ success: true, data: [] });
      }

      const wallet = await this.getOrCreateWallet(companyId);

      const tasksWithPayments = await Promise.all(
        contracts.map(async (contract) => {
          const payments = await Payment.find({ contractId: contract._id })
            .sort({ createdAt: -1 })
            .lean();

          const totalPaid = payments
            .filter(p => p.status === "completed")
            .reduce((sum, p) => sum + p.amount, 0);

          const totalBudget = contract.totalBudget || 0;
          const pendingAmount = totalBudget - totalPaid;

          return {
            contractId: contract._id,
            taskId: contract.taskId,
            vendor: contract.vendorId,
            title: contract.title || contract.taskId?.title || "Untitled Task",
            totalBudget,
            totalPaid,
            pendingAmount: pendingAmount > 0 ? pendingAmount : 0,
            paymentStatus: totalPaid >= totalBudget ? "paid" : totalPaid > 0 ? "partial" : "unpaid",
            payments,
            milestones: contract.milestones || [],
            walletBalance: wallet.balance,
            contractStatus: contract.status,
          };
        })
      );

      const activeTasks = tasksWithPayments.filter(task => task.pendingAmount > 0 || task.paymentStatus !== "paid");

      res.json({ success: true, data: activeTasks });
    } catch (error) {
      console.error("Error in getCompanyActiveTasks:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== GET VENDOR ACTIVE TASKS ====================

  async getVendorActiveTasks(req, res) {
    try {
      const vendorId = req.user.id;

      const contracts = await Contract.find({
        vendorId: vendorId,
        status: { $in: ["active", "in-progress", "pending-vendor"] },
      })
        .populate("taskId", "title description category budget")
        .populate("companyId", "fullName companyName email")
        .lean();

      if (!contracts.length) {
        return res.json({ success: true, data: [] });
      }

      const wallet = await this.getOrCreateWallet(vendorId);

      const tasksWithPayments = await Promise.all(
        contracts.map(async (contract) => {
          const payments = await Payment.find({ contractId: contract._id })
            .sort({ createdAt: -1 })
            .lean();

          const totalPaid = payments
            .filter(p => p.status === "completed")
            .reduce((sum, p) => sum + p.amount, 0);

          const totalBudget = contract.totalBudget || 0;
          const pendingAmount = totalBudget - totalPaid;

          const vendorReceived = payments
            .filter(p => p.status === "completed")
            .reduce((sum, p) => sum + (p.vendorAmount || p.amount), 0);

          return {
            contractId: contract._id,
            taskId: contract.taskId,
            company: contract.companyId,
            title: contract.title || contract.taskId?.title || "Untitled Task",
            totalBudget,
            totalPaid,
            vendorReceived,
            pendingAmount: pendingAmount > 0 ? pendingAmount : 0,
            canRequestPayment: pendingAmount > 0 && ["active", "in-progress"].includes(contract.status),
            payments: payments.map(p => ({
              _id: p._id,
              amount: p.amount,
              vendorAmount: p.vendorAmount || p.amount,
              platformFee: p.platformFee || 0,
              status: p.status,
              paymentType: p.paymentType,
              paymentDate: p.paymentDate,
              createdAt: p.createdAt,
              invoiceNumber: p.invoiceNumber,
              vendorConfirmed: p.vendorConfirmed || false,
            })),
            walletBalance: wallet.balance,
            lockedBalance: wallet.lockedBalance,
            contractStatus: contract.status,
          };
        })
      );

      const activeTasks = tasksWithPayments; // Removed filter (pendingAmount > 0)

      res.json({ success: true, data: activeTasks });
    } catch (error) {
      console.error("Error in getVendorActiveTasks:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== VENDOR PAYMENT SUMMARY ====================

  async getVendorPaymentSummary(req, res) {
    try {
      const vendorId = req.user.id;
      const wallet = await this.getOrCreateWallet(vendorId);

      const payments = await Payment.find({
        vendorId: vendorId,
        status: "completed",
      });

      const summary = {
        availableBalance: wallet.balance,
        lockedBalance: wallet.lockedBalance,
        totalEarned: wallet.totalReceived,
        totalWithdrawn: wallet.totalWithdrawn,
        pendingAmount: payments
          .filter(p => !p.vendorConfirmed)
          .reduce((sum, p) => sum + (p.vendorAmount || p.amount), 0),
        completedCount: payments.length,
        platformFees: payments.reduce((sum, p) => sum + (p.platformFee || 0), 0),
      };

      res.json({ success: true, data: summary });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== REQUEST PAYMENT ====================

  async requestPayment(req, res) {
    try {
      const { contractId, amount, milestoneId, notes } = req.body;
      const vendorId = req.user.id;

      const contract = await Contract.findById(contractId).populate("companyId");
      if (!contract) return res.status(404).json({ error: "Contract not found" });
      if (contract.vendorId.toString() !== vendorId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const remainingAmount = contract.totalBudget - (contract.totalPaid || 0);
      if (amount <= 0 || amount > remainingAmount) {
        return res.status(400).json({ error: `Invalid amount. Max: ${remainingAmount}` });
      }

      const paymentRequest = new Payment({
        taskId: contract.taskId,
        contractId: contract._id,
        companyId: contract.companyId._id,
        vendorId: contract.vendorId,
        amount,
        originalAmount: contract.totalBudget,
        paymentType: milestoneId ? "milestone" : "partial",
        milestoneId,
        status: "pending",
        notes: notes || "Payment request from vendor",
        createdBy: vendorId,
      });
      await paymentRequest.save();

      const notificationService = this.getNotificationService(req);
      if (notificationService) {
        try {
          await notificationService.createNotification({
            recipientId: contract.companyId._id,
            senderId: vendorId,
            type: "payment_request",
            title: "Payment Request",
            message: `Vendor requested payment of $${amount} for ${contract.title}`,
            data: { contractId, amount, paymentId: paymentRequest._id },
            relatedId: contract._id,
            relatedModel: "Contract",
          });
        } catch (e) { /* Ignore */ }
      }

      res.json({
        success: true,
        message: "Payment request sent",
        data: { paymentRequest },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== GET CONTRACT PAYMENTS ====================

  async getContractPayments(req, res) {
    try {
      const { contractId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const contract = await Contract.findById(contractId);
      if (!contract) return res.status(404).json({ error: "Contract not found" });

      // Ownership check
      if (userRole !== "admin" && contract.companyId.toString() !== userId && contract.vendorId.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to view these payments" });
      }

      const payments = await Payment.find({ contractId })
        .populate("taskId", "title")
        .populate("companyId", "fullName companyName email")
        .populate("vendorId", "fullName companyName email")
        .sort({ createdAt: -1 });

      res.json({ success: true, data: payments });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== GET PAYMENT BY ID ====================

  async getPaymentById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const payment = await Payment.findById(id)
        .populate("taskId", "title description")
        .populate("companyId", "fullName companyName email")
        .populate("vendorId", "fullName companyName email")
        .populate("contractId");

      if (!payment) return res.status(404).json({ error: "Payment not found" });

      // Ownership check
      if (userRole !== "admin" && payment.companyId._id.toString() !== userId && payment.vendorId._id.toString() !== userId) {
        return res.status(403).json({ error: "Not authorized to view this payment" });
      }

      const transaction = await Transaction.findOne({ paymentId: id });

      res.json({
        success: true,
        data: { ...payment.toObject(), transaction },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== ADMIN METHODS ====================

  async getAllPayments(req, res) {
    try {
      const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
      const query = {};

      if (status && status !== "all") query.status = status;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const payments = await Payment.find(query)
        .populate("taskId", "title")
        .populate("companyId", "fullName companyName email")
        .populate("vendorId", "fullName companyName email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Payment.countDocuments(query);

      // Get counts for all statuses
      const countsRaw = await Payment.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);
      const counts = { all: await Payment.countDocuments() };
      countsRaw.forEach(c => { counts[c._id] = c.count; });

      res.json({
        success: true,
        data: {
          payments,
          counts,
          pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAllTransactions(req, res) {
    try {
      const { type, status, startDate, endDate, page = 1, limit = 20 } = req.query;
      const query = {};

      if (type && type !== "all") query.type = type;
      if (status && status !== "all") query.status = status;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const transactions = await Transaction.find(query)
        .populate("fromUserId", "fullName companyName email")
        .populate("toUserId", "fullName companyName email")
        .populate("taskId", "title")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const total = await Transaction.countDocuments(query);

      // Get counts for all types
      const countsRaw = await Transaction.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } }
      ]);
      const counts = { all: await Transaction.countDocuments() };
      countsRaw.forEach(c => { counts[c._id] = c.count; });
      
      // Ensure specific types exist in the object even if 0
      ["deposit", "withdrawal", "payment", "refund", "subscription", "fee"].forEach(t => {
          if (!counts[t]) counts[t] = 0;
      });

      res.json({
        success: true,
        data: {
          transactions,
          counts,
          pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async processWithdrawal(req, res) {
    try {
      const { transactionId, status, adminNotes } = req.body;
      const adminId = req.user.id;

      const transaction = await Transaction.findById(transactionId);
      if (!transaction || transaction.type !== "withdrawal") {
        return res.status(404).json({ error: "Withdrawal not found" });
      }

      const wallet = await this.getOrCreateWallet(transaction.fromUserId);

      if (status === "completed") {
        wallet.lockedBalance -= transaction.amount;
        wallet.totalWithdrawn += transaction.amount;
        transaction.status = "completed";
        transaction.completedAt = new Date();
      } else if (status === "failed") {
        wallet.lockedBalance -= transaction.amount;
        wallet.balance += transaction.amount;
        transaction.status = "failed";
      }

      transaction.adminNotes = adminNotes;
      transaction.withdrawalDetails = transaction.withdrawalDetails || {};
      transaction.withdrawalDetails.processedBy = adminId;
      transaction.withdrawalDetails.processedAt = new Date();

      await wallet.save();
      await transaction.save();

      res.json({ success: true, message: `Withdrawal ${status}`, data: transaction });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== GENERATE INVOICE ====================

  async generateInvoice(req, res) {
    try {
      const { id } = req.params;

      const payment = await Payment.findById(id)
        .populate("taskId", "title description")
        .populate("companyId", "fullName companyName email")
        .populate("vendorId", "fullName companyName email");

      if (!payment) return res.status(404).json({ error: "Payment not found" });

      const transaction = await Transaction.findOne({ paymentId: id });
      const html = this.generateInvoiceHTML(payment, transaction);

      res.setHeader("Content-Type", "text/html");
      res.setHeader("Content-Disposition", `attachment; filename=invoice-${payment.invoiceNumber || id}.html`);
      res.send(html);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  generateInvoiceHTML(payment) {
    const formatDate = (date) => {
      if (!date) return "N/A";
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const formatCurrency = (amount) => `$${(amount || 0).toLocaleString("en-US")}`;

    return `<!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${payment.invoiceNumber || payment._id}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.15); }
        h1 { color: #333; border-bottom: 2px solid #8F63FF; padding-bottom: 10px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
        th { background-color: #f5f5f5; }
        .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
        .status { display: inline-block; padding: 5px 10px; border-radius: 4px; }
        .status.completed { background-color: #d4edda; color: #155724; }
        .footer { margin-top: 50px; text-align: center; color: #666; }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <h1>INVOICE</h1>
        <div class="header">
          <div>
            <h3>From: ${payment.companyId?.companyName || payment.companyId?.fullName || "Company"}</h3>
            <p>${payment.companyId?.email || ""}</p>
          </div>
          <div>
            <h3>To: ${payment.vendorId?.companyName || payment.vendorId?.fullName || "Vendor"}</h3>
            <p>${payment.vendorId?.email || ""}</p>
          </div>
        </div>
        <p><strong>Invoice Number:</strong> ${payment.invoiceNumber || payment._id}</p>
        <p><strong>Date:</strong> ${formatDate(payment.paymentDate || payment.createdAt)}</p>
        <p><strong>Status:</strong> <span class="status ${payment.status}">${payment.status.toUpperCase()}</span></p>
        <table>
          <thead><tr><th>Description</th><th>Type</th><th>Amount</th></tr></thead>
          <tbody>
            <tr>
              <td>${payment.taskId?.title || "Payment"}</td>
              <td>${payment.paymentType}</td>
              <td>${formatCurrency(payment.amount)}</td>
            </tr>
          </tbody>
        </table>
        <div class="total">Total: ${formatCurrency(payment.amount)}</div>
        ${payment.notes ? `<p><strong>Notes:</strong> ${payment.notes}</p>` : ""}
        <div class="footer">This is a computer generated invoice - Vendorlink</div>
      </div>
    </body>
    </html>`;
  }
}

module.exports = new PaymentController();
