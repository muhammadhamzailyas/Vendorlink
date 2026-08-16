# VendorLink

VendorLink is a web-based outsourcing platform designed to connect **companies with vendors** and provide a centralized system for managing the complete outsourcing lifecycle.

The platform allows companies to post projects, receive and evaluate vendor proposals, select suitable vendors, generate contracts, manage payments, communicate with vendors, and track project progress. Vendors can discover projects, submit proposals, manage their contracts, communicate with companies, and submit progress reports.

VendorLink also provides an administrative system for verifying vendors and documents, monitoring platform activity, and managing projects and users.

## Project Overview

Traditional outsourcing processes often involve multiple disconnected tools for finding vendors, communicating, managing contracts, tracking progress, and handling payments.

VendorLink brings these processes together into a single platform.

The main objective is to make outsourcing more **organized, transparent, and efficient** for both companies and vendors.

## How VendorLink Works

The general workflow of the platform is:

**Company Registration → Task Posting → Proposal Submission → Vendor Evaluation → Vendor Selection → Contract Generation → Payment → Project Execution → Progress Tracking → Completion → Feedback**

### 1. Company Creates a Task

A company creates a project/task describing:

* Project requirements
* Required skills
* Budget
* Deadline
* Description
* Other relevant requirements

### 2. Vendors Submit Proposals

Vendors can browse available projects and submit proposals containing their offer, experience, estimated cost, and other relevant information.

### 3. Vendor Evaluation

Companies can review submitted proposals and compare vendors.

VendorLink also includes an **AI-assisted vendor ranking system** that helps identify suitable vendors based on project requirements and available vendor information.

### 4. Vendor Selection

After reviewing the proposals, the company selects a vendor for the project.

### 5. Contract Generation

Once a vendor is selected, VendorLink generates a project contract containing the relevant project and agreement details.

### 6. Payment

The platform follows an escrow-based payment workflow where the company's payment is held until the agreed project conditions are fulfilled.

### 7. Project Execution

The selected vendor works on the project while both parties can communicate through the platform.

Companies can monitor the project's progress, while vendors can provide weekly progress reports and updates.

### 8. Project Completion

After the vendor completes the work and the company approves it, the project is marked as completed and the payment can be released.

The company can then provide feedback and a rating for the vendor.

---

## User Roles

VendorLink has three primary types of users.

### Company

Companies use VendorLink to:

* Create and manage projects
* Receive vendor proposals
* Evaluate vendors
* Select vendors
* Generate contracts
* Manage payments
* Communicate with vendors
* Track project progress
* Review completed projects

### Vendor

Vendors use the platform to:

* Browse available projects
* Submit proposals
* Manage active projects
* Manage contracts
* Communicate with companies
* Submit progress reports
* Track project activity
* Build their profile and reputation

### Admin

Administrators manage and monitor the platform.

Admin functionality includes:

* User management
* Vendor verification
* Document verification
* Project monitoring
* Contract oversight
* Payment monitoring
* Platform activity management
* Dispute management

---

## Main Features

### AI Vendor Ranking

VendorLink includes an AI-assisted ranking mechanism designed to help companies evaluate vendors and identify candidates that best match the requirements of a project.

The ranking can consider information such as:

* Required skills
* Vendor expertise
* Previous experience
* Proposal information
* Ratings and feedback
* Project requirements

### Real-Time Chat

Companies and vendors can communicate directly through the platform.

This keeps project-related communication centralized instead of relying on external messaging applications.

### Kanban-Based Progress Tracking

Projects include a Kanban-style workflow for tracking progress and managing project activities.

This allows companies and vendors to see the current state of project work and monitor ongoing tasks.

### Weekly Reports

Vendors can submit weekly reports describing their progress.

Companies can use these reports to monitor project development and identify potential issues early.

### Automated Contract Generation

After vendor selection, the platform can generate a contract using the project's relevant information and agreed terms.

### Escrow-Based Payments

VendorLink incorporates an escrow-style payment workflow intended to provide additional security for both parties.

The basic process is:

**Company Payment → Escrow → Project Completion → Company Approval → Vendor Payment**

### Vendor Verification

Administrators can verify vendors and review submitted documents before vendors participate fully in the platform.

---

## Technology Stack

### Frontend

* React
* React Router
* Redux Toolkit
* Material UI
* Tailwind CSS
* shadcn/ui
* Framer Motion
* Axios
* Day.js

### Backend

* Node.js
* Express.js
* REST APIs

### AI Services

* Python
* AI-assisted vendor ranking and analysis

### Database

* MongoDB

### Architecture

VendorLink uses a **React-based single-page application** communicating with a Node.js backend through APIs, while Python services handle AI-related functionality.

```text
                    VendorLink
                        │
          ┌─────────────┴─────────────┐
          │                           │
      React Frontend              Backend
          │                           │
          │                      Node.js
          │                      Express
          │                           │
          │              ┌────────────┴────────────┐
          │              │                         │
          │          MongoDB                 Python AI
          │                                    Services
          │
          └──────────── APIs ────────────────────┘
```

---

## Project Architecture

The system is divided into several major modules:

```text
VendorLink
│
├── Authentication & Authorization
│
├── Company Management
│   ├── Task Management
│   ├── Proposal Management
│   ├── Vendor Selection
│   ├── Contracts
│   ├── Payments
│   └── Reviews
│
├── Vendor Management
│   ├── Project Discovery
│   ├── Proposals
│   ├── Contracts
│   ├── Progress Reports
│   └── Reviews
│
├── Admin Management
│   ├── User Management
│   ├── Vendor Verification
│   ├── Document Verification
│   └── Platform Monitoring
│
├── Communication
│   └── Real-Time Chat
│
├── Project Management
│   ├── Kanban Boards
│   ├── Weekly Reports
│   └── Progress Tracking
│
└── AI Services
    └── Vendor Ranking
```

## Objective

The primary objective of VendorLink is to provide a complete digital platform for outsourcing that connects companies and vendors while reducing the complexity of managing outsourcing projects.

Instead of using separate systems for vendor discovery, proposals, communication, contracts, payments, and project tracking, VendorLink combines these processes into one centralized platform.

## Final Year Project

VendorLink was developed as a **Final Year Project for Software Engineering**.

The project demonstrates the implementation of a full-stack software system involving:

* Frontend development
* Backend development
* Database management
* REST API architecture
* Authentication and authorization
* Role-based access control
* AI integration
* Real-time communication
* Project management
* Contract management
* Payment workflows
* Administrative management
