const express = require("express");
const routineRouter = express.Router();
const { requireUser } = require("./utils");
const {
  getRoutineById,
  getRoutinesWithoutActivities,
  getAllRoutines,
  getAllPublicRoutines,
  getPublicRoutinesByUser,
  getAllRoutinesByUser,
  getPublicRoutinesByActivity,
  createRoutine,
  updateRoutine,
  destroyRoutine,
  addActivityToRoutine,
} = require("../db");

routineRouter.use((req, res, next) => {
  console.log("A request is being made to /routines");
  next();
});

// GET /routines
routineRouter.get("/", async (req, res, next) => {
  try {
    const routines = await getAllPublicRoutines();
    res.send(routines);
  } catch (error) {
    next({
      name: "NoPublicRoutines",
      message: "Unable to get all public routines",
    });
  }
});

//POST /routines (*)
routineRouter.post("/", requireUser, async (req, res, next) => {
  try {
    if (!req.body.name || !req.body.goal) {
      return next({
        name: "MissingNameOrGoal",
        message: "Please include both a name and a goal for your routine",
      });
    }
    const newRoutine = await createRoutine({
      creatorId: req.user.id,
      ...req.body,
    });
    res.send(newRoutine);
  } catch ({ name, message }) {
    next({ name, message });
  }
});

//PATCH /routines/:routineId (**)
routineRouter.patch("/:routineId", requireUser, async (req, res, next) => {
  try {
    const id = req.params.routineId;
    const ogRoutine = await getRoutineById(id);
    if (ogRoutine.creatorId != req.user.id) {
      return next({
        name: "InvalidUserCannotUpdate",
        message: "You are not the owner of this routine",
      });
    }
    const updatedRoutine = await updateRoutine({ id: id, ...req.body });
    res.send(updatedRoutine);
  } catch (error) {
    next({
      name: "FailedToUpdateRoutine",
      message: "This routine does not exist",
    });
  }
});

// DELETE /routines/:routineId (**)
routineRouter.delete("/:routineId", requireUser, async (req, res, next) => {
  try {
    const id = req.params.routineId * 1;
    const ogRoutine = await getRoutineById(id);
    if (ogRoutine.creatorId == req.user.id) {
      const routineToDestroy = await destroyRoutine(id);
      res.send(routineToDestroy);
    }
  } catch (error) {
    next({
      name: "InvalidUserCannotDelete",
      message: "You are not the owner of this routine",
    });
  }
});

//POST /routines/:routineId/activities
routineRouter.post("/:routineId/activities", async (req, res, next) => {
  const { activityId, count, duration } = req.body;
  const { routineId } = req.params;

  try {
    const routine_activity = await addActivityToRoutine({
      routineId,
      activityId,
      count,
      duration,
    });

    res.send(routine_activity);
  } catch (error) {
    next(error);
  }
});

module.exports = routineRouter;
