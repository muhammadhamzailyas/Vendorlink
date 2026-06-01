const Task = require("../model/task");
const Proposal = require("../model/proposal");
const Contract = require("../model/Contract");
const Payment = require("../model/Payment");
const User = require("../model/user");

const getNotificationService = (req) => {
  try {
    return req.app?.get("notificationService");
  } catch {
    return null;
  }
};

exports.createCompleteContract = async (req, res) => {
  try {
    const contractData = req.body;
    const userId = req.user._id.toString();

    if (!contractData.proposalId) {
      return res.status(400).json({ error: "Proposal ID is required" });
    }

    const proposal = await Proposal.findById(contractData.proposalId)
      .populate("taskId")
      .populate("companyId")
      .populate("vendorId");

    if (!proposal) {
      return res.status(404).json({ error: "Proposal not found" });
    }

    const proposalCompanyId = proposal.companyId?._id?.toString() || proposal.companyId?.toString();
    if (proposalCompanyId !== userId) {
      return res.status(403).json({
        error: "Only the company that owns this proposal can create contracts",
      });
    }

    const existingContract = await Contract.findOne({ proposalId: contractData.proposalId });
    if (existingContract) {
      return res.status(200).json({ message: "Contract already exists", contract: existingContract });
    }

    const contract = new Contract({
      taskId: proposal.taskId._id,
      proposalId: proposal._id,
      companyId: proposalCompanyId,
      vendorId: proposal.vendorId._id,

      title: contractData.title || proposal.taskId.title || "Contract",
      description: contractData.description || proposal.taskId.description || "",
      category: contractData.category || proposal.taskId.category || "",
      scope: contractData.scope || proposal.taskId.requirements || "",
      deliverables: contractData.deliverables || proposal.taskId.requirements || "",

      vendorSkills: proposal.skills || [],
      vendorExperience: proposal.experience || "",
      vendorApproach: proposal.proposalText || "",

      totalBudget:
        contractData.milestones?.reduce((sum, m) => sum + (Number(m.amount) || 0), 0) ||
        proposal.bidAmount ||
        0,

      projectStartDate: contractData.projectStartDate || new Date(),
      projectEndDate:
        contractData.projectEndDate ||
        proposal.proposedDeadline ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),

      milestones:
        contractData.milestones?.map((m) => ({
          title: m.title || "Milestone",
          description: m.description || "",
          amount: Number(m.amount) || 0,
          deadline: m.deadline || contractData.projectEndDate,
          status: "pending",
        })) || [],

      paymentTerms: contractData.paymentTerms || "milestone",
      paymentSchedule: contractData.paymentSchedule || "milestone-based",
      paymentMethod: contractData.paymentMethod || "bank-transfer",
      bankDetails: contractData.bankDetails || {},

      revisionLimit: contractData.revisionLimit || 3,
      revisionPolicy: contractData.revisionPolicy || "",
      intellectualProperty: contractData.intellectualProperty || "company",
      ipDetails: contractData.ipDetails || "",
      confidentialityClause: contractData.confidentialityClause !== undefined ? contractData.confidentialityClause : true,
      confidentialityPeriod: contractData.confidentialityPeriod || 24,
      confidentialityDetails: contractData.confidentialityDetails || "",
      terminationClause: contractData.terminationClause || "Either party may terminate this agreement with 7 days written notice.",
      noticePeriod: contractData.noticePeriod || 7,
      disputeResolution: contractData.disputeResolution || "negotiation",
      disputeResolutionDetails: contractData.disputeResolutionDetails || "",
      governingLaw: contractData.governingLaw || "Pakistan",
      warrantyPeriod: contractData.warrantyPeriod || 30,
      warrantyDetails: contractData.warrantyDetails || "",

      status: "pending-vendor",
      companyApproved: false, 
      vendorApproved: false,
      contractDate: new Date(),
      createdBy: userId,
    });

    await contract.save();

    await Proposal.findByIdAndUpdate(proposal._id, {
      status: "accepted",
      acceptedAt: new Date(),
    });

    const notificationService = getNotificationService(req);
    if (notificationService) {
      try {
        // Notify Vendor
        await notificationService.createNotification({
          recipientId: proposal.vendorId._id,
          senderId: userId,
          type: "contract_created",
          title: "New Contract Created",
          message: `A new contract has been created for "${proposal.taskId.title}". Please review and approve.`,
          data: {
            contractId: contract._id,
            taskId: proposal.taskId._id,
            taskTitle: proposal.taskId.title,
            role: "vendor",
          },
          relatedId: contract._id,
          relatedModel: "Contract",
          priority: "high",
        });

        // Notify Admins
        const admins = await User.find({ role: "admin" }).select("_id");
        for (const admin of admins) {
          await notificationService.createNotification({
            recipientId: admin._id,
            senderId: userId,
            type: "contract_created_admin",
            title: "Contract Agreement Initiated",
            message: `A new contract agreement has been initiated between ${proposal.companyId.companyName || 'Company'} and ${proposal.vendorId.fullName || 'Vendor'}.`,
            data: { contractId: contract._id, taskId: proposal.taskId._id },
            relatedId: contract._id,
            relatedModel: "Contract",
            priority: "low",
          });
        }
      } catch (notifError) {
        console.error("Failed to send contract notifications:", notifError);
      }
    }

    res.status(201).json({ message: "Contract created successfully", contract });
  } catch (error) {
    console.error("Create complete contract error:", error);
    res.status(500).json({ error: "Failed to create contract: " + error.message });
  }
};

exports.createContractFromProposal = async (req, res) => {
  try {
    const { proposalId } = req.body;
    const userId = req.user._id.toString();

    const proposal = await Proposal.findById(proposalId)
      .populate("taskId")
      .populate("companyId")
      .populate("vendorId");

    if (!proposal) return res.status(404).json({ error: "Proposal not found" });

    const proposalCompanyId = proposal.companyId?._id?.toString() || proposal.companyId?.toString();
    if (proposalCompanyId !== userId) {
      return res.status(403).json({ error: "Only the company can create contracts" });
    }

    const existingContract = await Contract.findOne({ proposalId });
    if (existingContract) {
      return res.status(200).json({ message: "Contract already exists", contract: existingContract });
    }

    let formattedMilestones = [];
    if (proposal.milestones?.length > 0) {
      formattedMilestones = proposal.milestones.map((m) => ({
        title: m.title || "Milestone",
        description: m.description || "",
        amount: m.amount || 0,
        deadline: m.deadline || proposal.proposedDeadline,
        status: "pending",
      }));
    } else {
      formattedMilestones = [
        {
          title: "Project Completion",
          description: "Complete project delivery and final approval",
          amount: proposal.bidAmount || 0,
          deadline: proposal.proposedDeadline || new Date(),
          status: "pending",
        },
      ];
    }

    const contract = new Contract({
      taskId: proposal.taskId._id,
      proposalId: proposal._id,
      companyId: proposalCompanyId,
      vendorId: proposal.vendorId._id,
      title: proposal.taskId.title || "Contract",
      description: proposal.taskId.description || "",
      category: proposal.taskId.category || "",
      scope: proposal.taskId.requirements || proposal.taskId.description || "",
      deliverables: proposal.taskId.requirements || "",
      vendorSkills: proposal.skills || [],
      vendorExperience: proposal.experience || "",
      vendorApproach: proposal.proposalText || "",
      totalBudget: proposal.bidAmount,
      projectStartDate: new Date(),
      projectEndDate: proposal.proposedDeadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      milestones: formattedMilestones,
      paymentTerms: "milestone",
      paymentSchedule: "milestone-based",
      paymentMethod: "bank-transfer",
      revisionLimit: 3,
      intellectualProperty: "company",
      confidentialityClause: true,
      confidentialityPeriod: 24,
      terminationClause: "Either party may terminate this agreement with 7 days written notice.",
      disputeResolution: "negotiation",
      governingLaw: "Pakistan",
      warrantyPeriod: 30,
      status: "pending-vendor",
      companyApproved: false, 
      vendorApproved: false,
      contractDate: new Date(),
      createdBy: userId,
    });

    await contract.save();

    await Proposal.findByIdAndUpdate(proposalId, {
      status: "accepted",
      acceptedAt: new Date(),
    });

    const notificationService = getNotificationService(req);
    if (notificationService) {
      try {
        await notificationService.createNotification({
          recipientId: proposal.vendorId._id,
          senderId: userId,
          type: "contract_created",
          title: "New Contract Created",
          message: `A new contract has been created for "${proposal.taskId.title}". Please review and approve.`,
          data: { contractId: contract._id, taskId: proposal.taskId._id, taskTitle: proposal.taskId.title, role: "vendor" },
          relatedId: contract._id,
          relatedModel: "Contract",
          priority: "high",
        });
      } catch (notifError) {
        console.error("Failed to send contract notification:", notifError);
      }
    }

    res.status(201).json({ message: "Contract created successfully", contract });
  } catch (error) {
    console.error("Create contract error:", error);
    res.status(500).json({ error: "Failed to create contract" });
  }
};

exports.approveContract = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();
    const { name } = req.body;

    const contract = await Contract.findById(id)
      .populate("companyId", "fullName email")
      .populate("vendorId", "fullName email");

    if (!contract) return res.status(404).json({ error: "Contract not found" });

    const companyId = contract.companyId?._id?.toString() || contract.companyId?.toString();
    const vendorId = contract.vendorId?._id?.toString() || contract.vendorId?.toString();
    const isCompany = companyId === userId;
    const isVendor = vendorId === userId;

    if (!isCompany && !isVendor) {
      return res.status(403).json({ error: "You are not authorized to approve this contract" });
    }

    if (["cancelled", "active", "completed", "rejected"].includes(contract.status)) {
      return res.status(400).json({ error: `Cannot approve ${contract.status} contract` });
    }

    if (isCompany) {
      if (contract.companyApproved) return res.status(400).json({ error: "Already approved by company" });
      contract.companyApproved = true;
      contract.companyApprovedAt = new Date();
      contract.companySignature = { name: name || contract.companyId?.fullName || "Company", date: new Date() };
    } else {
      if (contract.vendorApproved) return res.status(400).json({ error: "Already approved by vendor" });
      contract.vendorApproved = true;
      contract.vendorApprovedAt = new Date();
      contract.vendorSignature = { name: name || contract.vendorId?.fullName || "Vendor", date: new Date() };
    }

    if (contract.companyApproved && contract.vendorApproved) {
      contract.status = "active";
      contract.activatedAt = new Date();
      contract.effectiveDate = new Date();
    } else if (contract.vendorApproved && !contract.companyApproved) {
      contract.status = "pending-company";
    } else {
      contract.status = "pending-vendor";
    }

    await contract.save();

    const notificationService = getNotificationService(req);
    if (notificationService) {
      try {
        const recipientId = isCompany ? vendorId : companyId;
        await notificationService.createNotification({
          recipientId,
          senderId: userId,
          type: "contract_approved",
          title: contract.companyApproved && contract.vendorApproved ? "Contract Activated!" : "Contract Approved",
          message: contract.companyApproved && contract.vendorApproved
            ? `The contract "${contract.title}" is now active!`
            : `One party has approved the contract "${contract.title}".`,
          data: { contractId: contract._id, taskId: contract.taskId, taskTitle: contract.title },
          relatedId: contract._id,
          relatedModel: "Contract",
          priority: "high",
        });
      } catch (notifError) {
        console.error("Failed to send approval notification:", notifError);
      }
    }

    res.json({ message: "Contract approved successfully", contract });
  } catch (error) {
    console.error("Approve contract error:", error);
    res.status(500).json({ error: "Failed to approve contract" });
  }
};

exports.rejectContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id.toString();

    const contract = await Contract.findById(id).populate("taskId");
    if (!contract) return res.status(404).json({ error: "Contract not found" });

    const companyId = contract.companyId?.toString();
    const vendorId = contract.vendorId?.toString();
    const isCompany = companyId === userId;
    const isVendor = vendorId === userId;

    if (!isCompany && !isVendor) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (["active", "completed", "cancelled", "rejected"].includes(contract.status)) {
      return res.status(400).json({ error: `Cannot reject ${contract.status} contract` });
    }

    contract.status = "rejected";
    contract.rejectionReason = reason || "No reason provided";
    contract.rejectedAt = new Date();
    contract.rejectedBy = userId;
    contract.companyApproved = false;
    contract.vendorApproved = false;
    await contract.save();

    if (contract.taskId) {
      await Task.findByIdAndUpdate(contract.taskId._id || contract.taskId, { status: "open", selectedVendor: null });
    }
    if (contract.proposalId) {
      await Proposal.findByIdAndUpdate(contract.proposalId, { status: "submitted", acceptedAt: null });
    }

    const notificationService = getNotificationService(req);
    if (notificationService) {
      try {
        const recipientId = isCompany ? vendorId : companyId;
        await notificationService.createNotification({
          recipientId,
          senderId: userId,
          type: "contract_rejected",
          title: "Contract Rejected",
          message: `The contract "${contract.title}" has been rejected. ${reason ? `Reason: ${reason}` : ""}`,
          data: { contractId: contract._id, taskId: contract.taskId?._id, taskTitle: contract.title },
          relatedId: contract._id,
          relatedModel: "Contract",
          priority: "high",
        });
      } catch (notifError) {
        console.error("Failed to send rejection notification:", notifError);
      }
    }

    res.json({ message: "Contract rejected successfully", contract });
  } catch (error) {
    console.error("Reject contract error:", error);
    res.status(500).json({ error: "Failed to reject contract" });
  }
};

exports.cancelContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id.toString();

    const contract = await Contract.findById(id);
    if (!contract) return res.status(404).json({ error: "Contract not found" });

    const companyId = contract.companyId?.toString();
    const vendorId = contract.vendorId?.toString();
    const isCompany = companyId === userId;
    const isVendor = vendorId === userId;

    if (!isCompany && !isVendor) return res.status(403).json({ error: "Access denied" });

    // Allow cancellation strictly for active or draft state. 
    // Partially approved (pending-vendor) or completed contracts cannot be cancelled via this endpoint.
    if (!["active", "draft"].includes(contract.status)) {
      return res.status(400).json({ error: `Cannot cancel contract in ${contract.status} state. Only active or draft contracts can be cancelled.` });
    }

    contract.status = "cancelled";
    contract.cancellationReason = reason || "No reason provided";
    contract.cancelledAt = new Date();
    contract.cancelledBy = userId;
    await contract.save();

    if (contract.taskId) {
      await Task.findByIdAndUpdate(contract.taskId, { status: "open", selectedVendor: null });
    }
    if (contract.proposalId) {
      await Proposal.findByIdAndUpdate(contract.proposalId, { status: "submitted", acceptedAt: null });
    }

    const notificationService = getNotificationService(req);
    if (notificationService) {
      try {
        const recipientId = isCompany ? vendorId : companyId;
        if (recipientId) {
          await notificationService.createNotification({
            recipientId,
            senderId: userId,
            type: "contract_cancelled",
            title: "Contract Cancelled",
            message: `The contract "${contract.title}" has been cancelled. ${reason ? `Reason: ${reason}` : ""}`,
            data: { contractId: contract._id, taskId: contract.taskId, taskTitle: contract.title },
            relatedId: contract._id,
            relatedModel: "Contract",
            priority: "high",
          });
        }
      } catch (notifError) {
        console.error("Failed to send cancellation notification:", notifError);
      }
    }

    res.json({ message: "Contract cancelled successfully", contract });
  } catch (error) {
    console.error("Cancel contract error:", error);
    res.status(500).json({ error: "Failed to cancel contract" });
  }
};

exports.getCompanyContracts = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { status } = req.query;
    let query = { companyId: userId };
    if (status && status !== "all") query.status = status;

    const contracts = await Contract.find(query)
      .populate("taskId", "title description category")
      .populate("vendorId", "fullName email")
      .populate("proposalId")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: contracts });
  } catch (error) {
    console.error("Error in getCompanyContracts:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getVendorContracts = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { status } = req.query;
    let query = { vendorId: userId };
    if (status && status !== "all") query.status = status;

    const contracts = await Contract.find(query)
      .populate("taskId", "title description category")
      .populate("companyId", "fullName email")
      .populate("proposalId")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: contracts });
  } catch (error) {
    console.error("Error in getVendorContracts:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllContracts = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }

    const contracts = await Contract.find()
      .populate("taskId", "title description category")
      .populate("companyId", "fullName email companyName")
      .populate("vendorId", "fullName email")
      .populate("proposalId")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: contracts });
  } catch (error) {
    console.error("Error in getAllContracts:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getContractById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const contract = await Contract.findById(id)
      .populate("taskId", "title description category requirements createdAt")
      .populate("companyId", "fullName email")
      .populate("vendorId", "fullName email")
      .populate("proposalId")
      .populate("createdBy", "fullName");

    if (!contract) return res.status(404).json({ error: "Contract not found" });

    const companyId = contract.companyId?._id?.toString() || contract.companyId?.toString();
    const vendorId = contract.vendorId?._id?.toString() || contract.vendorId?.toString();
    if (companyId !== userId && vendorId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ success: true, data: contract });
  } catch (error) {
    console.error("Error in getContractById:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateContract = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();
    const updates = req.body;

    const contract = await Contract.findById(id);
    if (!contract) return res.status(404).json({ error: "Contract not found" });

    if (contract.companyId?.toString() !== userId) {
      return res.status(403).json({ error: "Only the company can update the contract" });
    }
    if (["active", "completed", "cancelled", "rejected"].includes(contract.status)) {
      return res.status(400).json({ error: "Cannot update contract in its current state" });
    }

    const allowedUpdates = [
      "title", "description", "scope", "deliverables", "milestones",
      "projectStartDate", "projectEndDate", "paymentTerms", "paymentSchedule",
      "paymentMethod", "bankDetails", "revisionLimit", "revisionPolicy",
      "intellectualProperty", "ipDetails", "confidentialityClause",
      "confidentialityPeriod", "confidentialityDetails", "terminationClause",
      "noticePeriod", "disputeResolution", "disputeResolutionDetails",
      "governingLaw", "warrantyPeriod", "warrantyDetails",
    ];

    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) contract[field] = updates[field];
    });

    await contract.save();

    const notificationService = getNotificationService(req);
    if (notificationService && contract.vendorId) {
      try {
        await notificationService.createNotification({
          recipientId: contract.vendorId,
          senderId: userId,
          type: "contract_needs_review",
          title: "Contract Updated",
          message: `The contract "${contract.title}" has been updated. Please review.`,
          data: { contractId: contract._id, taskId: contract.taskId, taskTitle: contract.title },
          relatedId: contract._id,
          relatedModel: "Contract",
          priority: "medium",
        });
      } catch (notifError) {
        console.error("Failed to send update notification:", notifError);
      }
    }

    res.json({ success: true, message: "Contract updated successfully", data: contract });
  } catch (error) {
    console.error("Error in updateContract:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.checkDeletability = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const contract = await Contract.findById(id);
    if (!contract) return res.status(404).json({ error: "Contract not found" });

    if (contract.companyId?.toString() !== userId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    // Level 3: Blocked (Active or Completed contracts with payments)
    const Payment = require("../model/Payment");
    const paymentCount = await Payment.countDocuments({ contractId: id });
    
    if (paymentCount > 0 || contract.status === "completed") {
      return res.json({
        canDelete: false,
        level: 3,
        message: "This contract is in the transaction phase or completed and cannot be deleted.",
        warning: "Financial records or final completions are associated with this contract. Deletion is restricted for auditing purposes."
      });
    }

    // Level 2: Warning (Active or Pending contracts but no payments)
    if (["active", "pending-vendor"].includes(contract.status)) {
      return res.json({
        canDelete: true,
        level: 2,
        message: "Warning: This is an active or pending agreement.",
        warning: "Deleting this contract will cancel the engagement with the vendor. The vendor will be notified. Are you sure you want to proceed?"
      });
    }

    // Level 1: Simple confirmation (Draft, Rejected, or Cancelled)
    return res.json({
      canDelete: true,
      level: 1,
      message: "Are you sure you want to delete this contract? This action cannot be undone.",
      warning: null
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteContract = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const contract = await Contract.findById(id);
    if (!contract) return res.status(404).json({ error: "Contract not found" });

    if (contract.companyId?.toString() !== userId) {
      return res.status(403).json({ error: "Only the company can delete contracts" });
    }
    if (!["draft", "cancelled", "rejected"].includes(contract.status)) {
      return res.status(400).json({ error: "Can only delete draft, cancelled, or rejected contracts" });
    }

    await Contract.findByIdAndDelete(id);
    res.json({ success: true, message: "Contract deleted successfully" });
  } catch (error) {
    console.error("Error in deleteContract:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.addNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user._id.toString();

    const contract = await Contract.findById(id);
    if (!contract) return res.status(404).json({ error: "Contract not found" });

    const companyId = contract.companyId?.toString();
    const vendorId = contract.vendorId?.toString();
    if (companyId !== userId && vendorId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    contract.notes = contract.notes || [];
    contract.notes.push({ content, createdBy: userId, createdAt: new Date() });
    await contract.save();

    res.json({ message: "Note added successfully", notes: contract.notes });
  } catch (error) {
    console.error("Add note error:", error);
    res.status(500).json({ error: "Failed to add note" });
  }
};

exports.getActiveContracts = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const contracts = await Contract.find({ vendorId: userId, status: "active" })
      .populate("taskId", "title description")
      .populate("companyId", "fullName email")
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: contracts });
  } catch (error) {
    console.error("Error in getActiveContracts:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.downloadContract = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const contract = await Contract.findById(id)
      .populate("taskId")
      .populate("companyId", "fullName email")
      .populate("vendorId", "fullName email")
      .populate("proposalId");

    if (!contract) return res.status(404).json({ error: "Contract not found" });

    const companyId = contract.companyId?._id?.toString() || contract.companyId?.toString();
    const vendorId = contract.vendorId?._id?.toString() || contract.vendorId?.toString();
    if (companyId !== userId && vendorId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const esc = (str) => String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const formatDate = (date) => date ? new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Not set";
    const formatCurrency = (amount) => `$${(amount || 0).toLocaleString("en-US")}`;

    const html = `<!DOCTYPE html><html><head><title>Contract - ${esc(contract.title)}</title>
<style>body{font-family:'Times New Roman',serif;margin:40px;line-height:1.6}h1{text-align:center;border-bottom:2px solid #333;padding-bottom:10px}h2{color:#444;margin-top:30px;font-size:18px}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#f5f5f5}</style></head>
<body><h1>CONTRACT AGREEMENT</h1>
<p><strong>Contract ID:</strong> ${esc(contract._id)}</p>
<p><strong>Date:</strong> ${formatDate(contract.contractDate)}</p>
<p><strong>Status:</strong> ${esc(contract.status).toUpperCase()}</p>
<h2>PARTIES</h2>
<p><strong>Company:</strong> ${esc(contract.companyId?.fullName || contract.companyId?.email)} (${esc(contract.companyId?.email)})</p>
<p><strong>Vendor:</strong> ${esc(contract.vendorId?.fullName || contract.vendorId?.email)} (${esc(contract.vendorId?.email)})</p>
<h2>PROJECT DETAILS</h2>
<p><strong>Title:</strong> ${esc(contract.title)}</p>
<p><strong>Description:</strong> ${esc(contract.description)}</p>
<p><strong>Scope:</strong> ${esc(contract.scope)}</p>
<h2>TIMELINE</h2>
<p><strong>Start:</strong> ${formatDate(contract.projectStartDate)}</p>
<p><strong>End:</strong> ${formatDate(contract.projectEndDate)}</p>
<h2>FINANCIAL TERMS</h2>
<p><strong>Total Budget:</strong> ${formatCurrency(contract.totalBudget)}</p>
<p><strong>Payment Terms:</strong> ${esc(contract.paymentTerms)}</p>
${contract.milestones?.length > 0 ? `<h2>MILESTONES</h2><table><thead><tr><th>Milestone</th><th>Amount</th><th>Deadline</th></tr></thead><tbody>${contract.milestones.map(m => `<tr><td>${esc(m.title)}</td><td>${formatCurrency(m.amount)}</td><td>${formatDate(m.deadline)}</td></tr>`).join("")}</tbody></table>` : ""}
<h2>LEGAL TERMS</h2>
<p><strong>IP:</strong> ${esc(contract.intellectualProperty)}</p>
<p><strong>Confidentiality:</strong> ${contract.confidentialityClause ? `Yes (${contract.confidentialityPeriod} months)` : "No"}</p>
<p><strong>Termination:</strong> ${esc(contract.terminationClause)}</p>
<p><strong>Dispute Resolution:</strong> ${esc(contract.disputeResolution)}</p>
<p><strong>Governing Law:</strong> ${esc(contract.governingLaw)}</p>
</body></html>`;

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `attachment; filename=contract-${contract._id}.html`);
    res.send(html);
  } catch (error) {
    console.error("Download contract error:", error);
    res.status(500).json({ error: "Failed to download contract" });
  }
};
