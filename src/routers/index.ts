import { Router } from "express";
import { prisma } from "~/utils/db";
import { HTTPError } from "~/utils/error";
import bcrypt from "bcryptjs";
import { z } from "zod";

const router = Router();

router.post("/auth/event-org/login", async (req, res) => {
  try {
    const { success, data, error } = z
      .object({
        email: z.string(),
        password: z.string(),
      })
      .safeParse(req.body);

    if (!success)
      throw new HTTPError(400, "Invalid Request Body: " + error.toString());

    const user = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
      select: {
        id: true,
        password: true,
        role: true,
      },
    });
    if (!user) throw new HTTPError(404, "User Not Found");

    if (user.role !== "ORGANIZER")
      throw new HTTPError(401, "Not an event organizer");

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) throw new HTTPError(401, "Invalid Password");

    res.status(200).send({ user_id: user.id });
  } catch (err) {
    console.log(err);
    if (err instanceof HTTPError) {
      res.status(err.status).send({ msg: err.message });
      return;
    }
    res.status(500).send({ msg: "Error Logging In" });
  }
});

router.get("/events/organizer", async (req, res) => {
  try {
    const idStr = req.headers.authorization?.split(" ")[1];
    if (!idStr) throw new HTTPError(401, "Unauthorized");

    const userId = parseInt(idStr);

    const events = await prisma.event.findMany({
      where: {
        published: true,
        Organizers: {
          some: {
            userId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    res.status(200).send({ events });
  } catch (err) {
    console.log(err);
    res.status(500).send({ msg: "Error Fetching Events" });
  }
});

router.post("/issue-certificates", async (req, res) => {
  try {
    const { success, data, error } = z
      .object({
        eventId: z.number(),
      })
      .safeParse(req.body);

    if (!success)
      throw new HTTPError(400, "Invalid Request Body: " + error.toString());

    const idStr = req.headers.authorization?.split(" ")[1];
    if (!idStr) throw new HTTPError(401, "Unauthorized");

    const userId = parseInt(idStr);

    const event = await prisma.event.findUnique({
      where: {
        id: data.eventId,
      },
      select: {
        Organizers: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!event) throw new HTTPError(404, "Event Not Found");

    if (event.Organizers.filter((org) => org.userId === userId).length === 0)
      throw new HTTPError(401, "Unauthorized");

    const teams = await prisma.team.findMany({
      where: {
        eventId: data.eventId,
        attended: true,
      },
      select: {
        TeamMembers: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (teams.length === 0) throw new HTTPError(404, "No Teams Found");

    const participants = teams.flatMap((team) => {
      return team.TeamMembers.map((member) => {
        return {
          userId: member.userId,
          eventId: data.eventId,
        };
      });
    });

    await prisma.certificateIssue.createMany({
      data: participants,
      skipDuplicates: true,
    });

    res.status(200).send({ msg: "Certificates Issued" });
  } catch (err) {
    console.log(err);
    if (err instanceof HTTPError) {
      res.status(err.status).send({ msg: err.message });
      return;
    }
    res.status(500).send({ msg: "Error Issuing Certificates" });
  }
});

router.get("/event/:eid/participants", async (req, res) => {
  try {
    const eventId = parseInt(req.params.eid);

    const idStr = req.headers.authorization?.split(" ")[1];
    if (!idStr) throw new HTTPError(401, "Unauthorized");

    const userId = parseInt(idStr);

    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
      select: {
        Organizers: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!event) throw new HTTPError(404, "Event Not Found");

    if (!event.Organizers.find((org) => org.userId === userId))
      throw new HTTPError(401, "Unauthorized");

    const users = await prisma.certificateIssue.findMany({
      where: {
        eventId: eventId,
      },
      select: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            College: {
              select: {
                name: true,
              },
            },
          },
        },
        issued: true,
        id: true,
      },
    });

    res.status(200).send({
      participants: users.map((user) => {
        return {
          cid: user.id,
          id: user.User.id,
          name: user.User.name,
          email: user.User.email,
          college: user.User.College ? user.User.College.name : "OTHER",
          issued: user.issued,
        };
      }),
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({ msg: "Error Fetching Users" });
  }
});

router.put("/mark-as-sent/:cid", async (req, res) => {
  try {
    const cid = parseInt(req.params.cid);

    await prisma.certificateIssue.update({
      where: {
        id: cid,
      },
      data: {
        issued: true,
      },
    });

    res.status(200).send({ msg: "Marked as Sent" });
  } catch (err) {
    console.log(err);
    res.status(500).send({ msg: "Error Marking as Sent" });
  }
});

export { router as certificateRouter };
