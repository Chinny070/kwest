// Auto-generated ABI for Kwest.sol
export const KWEST_ABI = [
  // ── Constructor ──
  {
    "type": "constructor",
    "inputs": [
      { "name": "_usdc", "type": "address" },
      { "name": "_owner", "type": "address" }
    ],
    "stateMutability": "nonpayable"
  },

  // ── Errors ──
  { "type": "error", "name": "TaskNotFound", "inputs": [] },
  { "type": "error", "name": "TaskNotActive", "inputs": [] },
  { "type": "error", "name": "TaskDeadlinePassed", "inputs": [] },
  { "type": "error", "name": "CreatorCannotComplete", "inputs": [] },
  { "type": "error", "name": "AlreadySubmitted", "inputs": [] },
  { "type": "error", "name": "SubmissionNotFound", "inputs": [] },
  { "type": "error", "name": "NotSubmissionWorker", "inputs": [] },
  { "type": "error", "name": "NotTaskCreator", "inputs": [] },
  { "type": "error", "name": "SubmissionNotApproved", "inputs": [] },
  { "type": "error", "name": "AlreadyClaimed", "inputs": [] },
  { "type": "error", "name": "TaskFull", "inputs": [] },
  { "type": "error", "name": "InsufficientReward", "inputs": [] },
  { "type": "error", "name": "TooManySlotsForReward", "inputs": [] },
  { "type": "error", "name": "InvalidSlotCount", "inputs": [] },
  { "type": "error", "name": "InvalidDeadline", "inputs": [] },
  { "type": "error", "name": "ZeroAddress", "inputs": [] },
  { "type": "error", "name": "NoFeesToWithdraw", "inputs": [] },
  { "type": "error", "name": "TransferFailed", "inputs": [] },
  { "type": "error", "name": "CannotCancelWithPendingSubmissions", "inputs": [] },
  {
    "type": "error",
    "name": "OwnableUnauthorized",
    "inputs": [{ "name": "account", "type": "address" }]
  },

  // ── Events ──
  {
    "type": "event", "name": "TaskCreated",
    "inputs": [
      { "name": "taskId", "type": "uint256", "indexed": true },
      { "name": "creator", "type": "address", "indexed": true },
      { "name": "rewardPerSlot", "type": "uint256", "indexed": false },
      { "name": "totalSlots", "type": "uint256", "indexed": false },
      { "name": "totalDeposited", "type": "uint256", "indexed": false },
      { "name": "feePaid", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event", "name": "ProofSubmitted",
    "inputs": [
      { "name": "submissionId", "type": "uint256", "indexed": true },
      { "name": "taskId", "type": "uint256", "indexed": true },
      { "name": "worker", "type": "address", "indexed": true },
      { "name": "proofData", "type": "string", "indexed": false }
    ]
  },
  {
    "type": "event", "name": "SubmissionApproved",
    "inputs": [
      { "name": "submissionId", "type": "uint256", "indexed": true },
      { "name": "taskId", "type": "uint256", "indexed": true },
      { "name": "worker", "type": "address", "indexed": true }
    ]
  },
  {
    "type": "event", "name": "SubmissionRejected",
    "inputs": [
      { "name": "submissionId", "type": "uint256", "indexed": true },
      { "name": "taskId", "type": "uint256", "indexed": true },
      { "name": "worker", "type": "address", "indexed": true }
    ]
  },
  {
    "type": "event", "name": "RewardClaimed",
    "inputs": [
      { "name": "submissionId", "type": "uint256", "indexed": true },
      { "name": "worker", "type": "address", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event", "name": "TaskCancelled",
    "inputs": [
      { "name": "taskId", "type": "uint256", "indexed": true },
      { "name": "refundAmount", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event", "name": "FeesWithdrawn",
    "inputs": [
      { "name": "to", "type": "address", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": false }
    ]
  },

  // ── View: Constants ──
  {
    "type": "function", "name": "FEE_BPS",
    "inputs": [], "outputs": [{ "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "BPS_DENOMINATOR",
    "inputs": [], "outputs": [{ "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "MIN_REWARD_PER_SLOT",
    "inputs": [], "outputs": [{ "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "LOW_REWARD_THRESHOLD",
    "inputs": [], "outputs": [{ "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "LOW_REWARD_MAX_SLOTS",
    "inputs": [], "outputs": [{ "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "REJECTION_MULTIPLIER",
    "inputs": [], "outputs": [{ "type": "uint256" }],
    "stateMutability": "view"
  },

  // ── View: State ──
  {
    "type": "function", "name": "usdc",
    "inputs": [], "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "nextTaskId",
    "inputs": [], "outputs": [{ "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "accumulatedFees",
    "inputs": [], "outputs": [{ "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "owner",
    "inputs": [], "outputs": [{ "type": "address" }],
    "stateMutability": "view"
  },

  // ── Write: createTask ──
  {
    "type": "function", "name": "createTask",
    "inputs": [
      { "name": "title", "type": "string" },
      { "name": "description", "type": "string" },
      { "name": "proofRequirements", "type": "string" },
      { "name": "proofType", "type": "uint8" },
      { "name": "rewardPerSlot", "type": "uint256" },
      { "name": "totalSlots", "type": "uint256" },
      { "name": "deadline", "type": "uint256" },
      { "name": "deductFeeFromPool", "type": "bool" }
    ],
    "outputs": [{ "name": "taskId", "type": "uint256" }],
    "stateMutability": "nonpayable"
  },

  // ── Write: submitProof ──
  {
    "type": "function", "name": "submitProof",
    "inputs": [
      { "name": "taskId", "type": "uint256" },
      { "name": "proofData", "type": "string" }
    ],
    "outputs": [{ "name": "submissionId", "type": "uint256" }],
    "stateMutability": "nonpayable"
  },

  // ── Write: approveSubmission ──
  {
    "type": "function", "name": "approveSubmission",
    "inputs": [{ "name": "submissionId", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },

  // ── Write: rejectSubmission ──
  {
    "type": "function", "name": "rejectSubmission",
    "inputs": [{ "name": "submissionId", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },

  // ── Write: claimReward ──
  {
    "type": "function", "name": "claimReward",
    "inputs": [{ "name": "submissionId", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },

  // ── Write: cancelTask ──
  {
    "type": "function", "name": "cancelTask",
    "inputs": [{ "name": "taskId", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },

  // ── Write: withdrawFees ──
  {
    "type": "function", "name": "withdrawFees",
    "inputs": [{ "name": "to", "type": "address" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },

  // ── View: getTask ──
  {
    "type": "function", "name": "getTask",
    "inputs": [{ "name": "taskId", "type": "uint256" }],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          { "name": "id", "type": "uint256" },
          { "name": "creator", "type": "address" },
          { "name": "title", "type": "string" },
          { "name": "description", "type": "string" },
          { "name": "proofRequirements", "type": "string" },
          { "name": "proofType", "type": "uint8" },
          { "name": "rewardPerSlot", "type": "uint256" },
          { "name": "totalSlots", "type": "uint256" },
          { "name": "filledSlots", "type": "uint256" },
          { "name": "totalDeposited", "type": "uint256" },
          { "name": "status", "type": "uint8" },
          { "name": "createdAt", "type": "uint256" },
          { "name": "deadline", "type": "uint256" },
          { "name": "rejectionCount", "type": "uint256" }
        ]
      }
    ],
    "stateMutability": "view"
  },

  // ── View: getSubmission ──
  {
    "type": "function", "name": "getSubmission",
    "inputs": [{ "name": "submissionId", "type": "uint256" }],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          { "name": "id", "type": "uint256" },
          { "name": "taskId", "type": "uint256" },
          { "name": "worker", "type": "address" },
          { "name": "proofData", "type": "string" },
          { "name": "proofType", "type": "uint8" },
          { "name": "status", "type": "uint8" },
          { "name": "submittedAt", "type": "uint256" },
          { "name": "claimed", "type": "bool" }
        ]
      }
    ],
    "stateMutability": "view"
  },

  // ── View: getTaskSubmissions ──
  {
    "type": "function", "name": "getTaskSubmissions",
    "inputs": [{ "name": "taskId", "type": "uint256" }],
    "outputs": [{ "name": "", "type": "uint256[]" }],
    "stateMutability": "view"
  },

  // ── View: getWorkerSubmissions ──
  {
    "type": "function", "name": "getWorkerSubmissions",
    "inputs": [{ "name": "worker", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256[]" }],
    "stateMutability": "view"
  },

  // ── View: getCreatorTasks ──
  {
    "type": "function", "name": "getCreatorTasks",
    "inputs": [{ "name": "creator", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256[]" }],
    "stateMutability": "view"
  },

  // ── View: getWorkerSubmissionForTask ──
  {
    "type": "function", "name": "getWorkerSubmissionForTask",
    "inputs": [
      { "name": "taskId", "type": "uint256" },
      { "name": "worker", "type": "address" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },

  // ── View: quoteTask ──
  {
    "type": "function", "name": "quoteTask",
    "inputs": [
      { "name": "rewardPerSlot", "type": "uint256" },
      { "name": "totalSlots", "type": "uint256" },
      { "name": "deductFeeFromPool", "type": "bool" }
    ],
    "outputs": [
      { "name": "transferAmount", "type": "uint256" },
      { "name": "rewardPool", "type": "uint256" },
      { "name": "fee", "type": "uint256" },
      { "name": "effectiveRewardPerSlot", "type": "uint256" }
    ],
    "stateMutability": "pure"
  },

  // ── View: getAllTaskIds ──
  {
    "type": "function", "name": "getAllTaskIds",
    "inputs": [
      { "name": "offset", "type": "uint256" },
      { "name": "limit", "type": "uint256" }
    ],
    "outputs": [
      { "name": "ids", "type": "uint256[]" },
      { "name": "total", "type": "uint256" }
    ],
    "stateMutability": "view"
  }
] as const;

export const ERC20_ABI = [
  {
    "type": "function", "name": "balanceOf",
    "inputs": [{ "name": "account", "type": "address" }],
    "outputs": [{ "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "allowance",
    "inputs": [
      { "name": "owner", "type": "address" },
      { "name": "spender", "type": "address" }
    ],
    "outputs": [{ "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "approve",
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": [{ "type": "bool" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function", "name": "decimals",
    "inputs": [],
    "outputs": [{ "type": "uint8" }],
    "stateMutability": "view"
  },
  {
    "type": "function", "name": "symbol",
    "inputs": [],
    "outputs": [{ "type": "string" }],
    "stateMutability": "view"
  }
] as const;
