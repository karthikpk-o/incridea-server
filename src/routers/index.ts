import { Router } from "express";
import { prisma } from "~/utils/db";
import { HTTPError } from "~/utils/error";

const router = Router();

// TODO(Omkar): ADD AUTH
router.get("/events", async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: {
        published: true,
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

router.post("/:eid", async (req, res) => {
  try {
    const eventId = parseInt(req.params.eid);

    const teams = await prisma.team.findMany({
      where: {
        eventId: eventId,
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
          eventId: eventId,
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
  } catch (err: unknown) {
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
  } catch (err: unknown) {
    console.log(err);
    res.status(500).send({ msg: "Error Marking as Sent" });
  }
});

export { router as certificateRouter };
