
const express = require("express");
const router = express.Router();

const Token = require("../models/Token");
const Counter = require("../models/Counter");

const { authMiddleware, staffOnly } = require("../middleware/authMiddleware");
router.post(
    "/call-next/:counterId",
    authMiddleware,
    staffOnly,
    async (req, res) => {
        try {
            const counterId = req.user.counter._id.toString();

            if (req.params.counterId !== counterId) {
                return res.status(403).json({
                    message: "Unauthorized counter access"
                });
            }

            const counter = await Counter.findById(counterId);

            if (!counter || ["Offline", "On Break"].includes(counter.status)) {
                return res.status(400).json({
                    message: "Counter is unavailable"
                });
            }
            const activeToken = await Token.findOne({
                counter: counterId,
                status: { $in: ["Called", "Serving"] }
            });

            if (activeToken) {
                return res.status(409).json({
                    message: "Complete or manage the current customer first"
                });
            }

            const token = await Token.findOne({
                status: "Waiting",
                service: { $in: counter.services }
            }).sort({ priority: 1, createdAt: 1 });

            if (!token) {
                return res.status(404).json({
                    message: "No waiting customers"
                });
            }

            token.status = "Called";
            token.counter = counterId;
            token.calledAt = new Date();

            await token.save();

            counter.status = "Busy";
            await counter.save();

            const result = await Token.findById(token._id)
                .populate("customer", "name mobile")
                .populate("service", "name prefix averageTime")
                .populate("counter", "counterNumber");

            res.json({
                message: "Customer called successfully",
                token: result
            });

        } catch (err) {
            res.status(500).json({
                message: err.message
            });
        }
    }
);


// PASTE START SERVICE API HERE

router.put(
    "/start/:tokenId",
    authMiddleware,
    staffOnly,
    async (req, res) => {
        try {
            const token = await Token.findById(req.params.tokenId);

            if (!token) {
                return res.status(404).json({
                    message: "Token not found"
                });
            }

            if (
                !token.counter ||
                token.counter.toString() !== req.user.counter._id.toString()
            ) {
                return res.status(403).json({
                    message: "Unauthorized customer"
                });
            }

            if (token.status !== "Called") {
                return res.status(400).json({
                    message: "Customer must be called first"
                });
            }

            token.status = "Serving";
            token.serviceStartedAt = new Date();

            await token.save();

            res.json({
                message: "Service started successfully",
                token
            });

        } catch (err) {
            res.status(500).json({
                message: err.message
            });
        }
    }
);

// Staff: Hold current customer
router.put(
    "/hold/:tokenId",
    authMiddleware,
    staffOnly,
    async (req, res) => {
        try {
            const token = await Token.findById(req.params.tokenId);

            if (!token) {
                return res.status(404).json({
                    message: "Token not found"
                });
            }

            if (
                !token.counter ||
                token.counter.toString() !== req.user.counter._id.toString()
            ) {
                return res.status(403).json({
                    message: "Unauthorized customer"
                });
            }

            if (token.status !== "Serving") {
                return res.status(400).json({
                    message: "Only serving customers can be put on hold"
                });
            }

            token.status = "On Hold";
            token.heldAt = new Date();

            await token.save();

            await Counter.findByIdAndUpdate(token.counter, {
                status: "Available"
            });

            res.json({
                message: "Customer placed on hold successfully",
                token
            });

        } catch (err) {
            res.status(500).json({
                message: err.message
            });
        }
    }
);

// Staff: Recall held customer
router.put(
    "/recall/:tokenId",
    authMiddleware,
    staffOnly,
    async (req, res) => {
        try {
            const counterId = req.user.counter._id;

            const token = await Token.findOne({
                _id: req.params.tokenId,
                counter: counterId,
                status: "On Hold"
            });

            if (!token) {
                return res.status(404).json({
                    message: "Held customer not found"
                });
            }

            const active = await Token.findOne({
                counter: counterId,
                status: { $in: ["Called", "Serving"] }
            });

            if (active) {
                return res.status(409).json({
                    message: "Finish current customer before recall"
                });
            }

            token.status = "Called";
            token.recalledAt = new Date();

            await token.save();

            await Counter.findByIdAndUpdate(counterId, {
                status: "Busy"
            });

            res.json({
                message: "Customer recalled successfully",
                token
            });

        } catch (err) {
            res.status(500).json({
                message: err.message
            });
        }
    }
);

// Staff: Mark customer as No Show
router.put(
    "/no-show/:tokenId",
    authMiddleware,
    staffOnly,
    async (req, res) => {
        try {
            const token = await Token.findById(req.params.tokenId);

            if (!token) {
                return res.status(404).json({
                    message: "Token not found"
                });
            }

            if (
                !token.counter ||
                token.counter.toString() !== req.user.counter._id.toString()
            ) {
                return res.status(403).json({
                    message: "Unauthorized customer"
                });
            }

            if (token.status !== "Called") {
                return res.status(400).json({
                    message: "Only called customers can be marked No Show"
                });
            }

            token.status = "No Show";
            token.noShowAt = new Date();

            await token.save();

            await Counter.findByIdAndUpdate(token.counter, {
                status: "Available"
            });

            res.json({
                message: "Customer marked as No Show",
                token
            });

        } catch (err) {
            res.status(500).json({
                message: err.message
            });
        }
    }
);



// Staff: Transfer customer to another counter
router.put(
    "/transfer/:tokenId",
    authMiddleware,
    staffOnly,
    async (req, res) => {
        try {
            const { destinationCounterId } = req.body;

            const sourceCounterId = req.user.counter._id;

            const token = await Token.findById(req.params.tokenId);

            if (!token) {
                return res.status(404).json({
                    message: "Token not found"
                });
            }

            if (
                !token.counter ||
                token.counter.toString() !== sourceCounterId.toString()
            ) {
                return res.status(403).json({
                    message: "Unauthorized customer"
                });
            }

            if (!["Called", "Serving"].includes(token.status)) {
                return res.status(400).json({
                    message: "Customer cannot be transferred"
                });
            }

            if (
                !destinationCounterId ||
                destinationCounterId.toString() === sourceCounterId.toString()
            ) {
                return res.status(400).json({
                    message: "Select another counter"
                });
            }

            const destination = await Counter.findById(
                destinationCounterId
            );

            if (!destination || destination.status === "Offline") {
                return res.status(400).json({
                    message: "Destination counter is unavailable"
                });
            }

            const supportsService = destination.services.some(
                serviceId =>
                    serviceId.toString() === token.service.toString()
            );

            if (!supportsService) {
                return res.status(400).json({
                    message: "Destination counter does not support this service"
                });
            }

            token.status = "Waiting";
            token.transferredFromCounter = sourceCounterId;
            token.transferredAt = new Date();
            token.counter = null;

            await token.save();

            await Counter.findByIdAndUpdate(sourceCounterId, {
                status: "Available"
            });

            res.json({
                message: `Customer transferred to Counter ${destination.counterNumber}`,
                token
            });

        } catch (err) {
            res.status(500).json({
                message: err.message
            });
        }
    }
);
// Admin dashboard: today's stats
router.get("/stats/today", authMiddleware, async (req, res) => {
    try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const todayFilter = { createdAt: { $gte: start } };

        const total = await Token.countDocuments(todayFilter);
        const waiting = await Token.countDocuments({ ...todayFilter, status: "Waiting" });
        const serving = await Token.countDocuments({ ...todayFilter, status: { $in: ["Called", "Serving"] } });
        const completed = await Token.countDocuments({ ...todayFilter, status: "Completed" });

        res.json({ total, waiting, serving, completed });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// Staff: waiting customers for this counter
router.get(
    "/counter/:counterId/waiting",
    authMiddleware,
    staffOnly,
    async (req, res) => {
        try {
            const counter = await Counter.findById(req.params.counterId);

            if (!counter) {
                return res.json([]);
            }

            const tokens = await Token.find({
                status: "Waiting",
                service: { $in: counter.services }
            })
                .sort({ priority: 1, createdAt: 1 })
                .populate("customer", "name mobile")
                .populate("service", "name prefix averageTime");

            res.json(tokens);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);
// Staff: current customer (Called or Serving) at this counter
router.get(
    "/counter/:counterId/current",
    authMiddleware,
    staffOnly,
    async (req, res) => {
        try {
            const token = await Token.findOne({
                counter: req.params.counterId,
                status: { $in: ["Called", "Serving"] }
            })
                .populate("customer", "name mobile")
                .populate("service", "name prefix averageTime");

            res.json(token || null);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

// Staff: complete service
router.put(
    "/complete/:tokenId",
    authMiddleware,
    staffOnly,
    async (req, res) => {
        try {
            const token = await Token.findById(req.params.tokenId);

            if (!token) {
                return res.status(404).json({ message: "Token not found" });
            }

            if (
                !token.counter ||
                token.counter.toString() !== req.user.counter._id.toString()
            ) {
                return res.status(403).json({ message: "Unauthorized customer" });
            }

            if (token.status !== "Serving") {
                return res.status(400).json({ message: "Start service first" });
            }

            token.status = "Completed";
            token.completedAt = new Date();
            await token.save();

            await Counter.findByIdAndUpdate(token.counter, {
                status: "Available"
            });

            res.json({ message: "Service completed", token });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

// Staff: statistics for the bottom boxes
router.get("/staff-stats", authMiddleware, staffOnly, async (req, res) => {
    try {
        const counter = await Counter.findById(req.user.counter._id);
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const waiting = await Token.countDocuments({
            status: "Waiting",
            service: { $in: counter.services }
        });
        const onHold = await Token.countDocuments({
            counter: counter._id,
            status: "On Hold"
        });
        const noShow = await Token.countDocuments({
            counter: counter._id,
            status: "No Show",
            updatedAt: { $gte: start }
        });
        const completed = await Token.countDocuments({
            counter: counter._id,
            status: "Completed",
            updatedAt: { $gte: start }
        });

        res.json({ waiting, onHold, noShow, completed });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// Staff: customers on hold at this counter
router.get(
    "/counter/:counterId/held",
    authMiddleware,
    staffOnly,
    async (req, res) => {
        try {
            const tokens = await Token.find({
                counter: req.params.counterId,
                status: "On Hold"
            })
                .populate("customer", "name mobile")
                .populate("service", "name prefix averageTime");

            res.json(tokens);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);
// Staff: change own counter status (Available / On Break)
router.put(
    "/counter-status",
    authMiddleware,
    staffOnly,
    async (req, res) => {
        try {
            const { status } = req.body;

            if (!["Available", "On Break"].includes(status)) {
                return res.status(400).json({ message: "Invalid status" });
            }

            const active = await Token.findOne({
                counter: req.user.counter._id,
                status: { $in: ["Called", "Serving"] }
            });

            if (status === "On Break" && active) {
                return res.status(409).json({
                    message: "Finish the current customer before going on break"
                });
            }

            const counter = await Counter.findByIdAndUpdate(
                req.user.counter._id,
                { status },
                { new: true }
            );

            res.json({ message: `Counter is now ${status}`, counter });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);

// Staff: get own counter status
router.get(
    "/counter-status",
    authMiddleware,
    staffOnly,
    async (req, res) => {
        try {
            const counter = await Counter.findById(req.user.counter._id);
            res.json({
                counterNumber: counter.counterNumber,
                status: counter.status
            });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);
// Staff: other counters that support a service (for transfer)
router.get(
    "/transfer-options/:tokenId",
    authMiddleware,
    staffOnly,
    async (req, res) => {
        try {
            const token = await Token.findById(req.params.tokenId);

            if (!token) {
                return res.status(404).json({ message: "Token not found" });
            }

            const counters = await Counter.find({
                _id: { $ne: req.user.counter._id },
                services: token.service,
                status: { $nin: ["Offline", "On Break"] }
            }).select("counterNumber status");

            res.json(counters);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
);
// Admin: today's report summary
router.get("/reports/summary", authMiddleware, async (req, res) => {
    try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const tokens = await Token.find({ createdAt: { $gte: start } })
            .populate("service", "name")
            .populate("counter", "counterNumber");

        const count = status => tokens.filter(t => t.status === status).length;

        const avg = (list, from, to) => {
            const times = list
                .filter(t => t[from] && t[to])
                .map(t => (new Date(t[to]) - new Date(t[from])) / 60000);
            return times.length
                ? Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10
                : 0;
        };

        const perServiceMap = {};
        tokens.forEach(t => {
            const name = t.service?.name || "Unknown";
            if (!perServiceMap[name]) perServiceMap[name] = { name, count: 0, completed: 0 };
            perServiceMap[name].count++;
            if (t.status === "Completed") perServiceMap[name].completed++;
        });

        const perCounterMap = {};
        tokens
            .filter(t => t.status === "Completed" && t.counter)
            .forEach(t => {
                const n = t.counter.counterNumber;
                if (!perCounterMap[n]) perCounterMap[n] = { counterNumber: n, served: 0 };
                perCounterMap[n].served++;
            });

        res.json({
            total: tokens.length,
            completed: count("Completed"),
            waiting: count("Waiting"),
            cancelled: count("Cancelled"),
            noShow: count("No Show"),
            avgWaitMinutes: avg(tokens, "createdAt", "calledAt"),
            avgServiceMinutes: avg(tokens, "serviceStartedAt", "completedAt"),
            perService: Object.values(perServiceMap),
            perCounter: Object.values(perCounterMap)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
module.exports = router;