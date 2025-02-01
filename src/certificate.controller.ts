import { Request, Response } from "express";
import { HTTPError } from "./utils/error";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function fetchPublishedEvents(_: Request, res: Response) {
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
  } catch (err: unknown) {
    console.log(err);
    res.status(500).send({ msg: "Error Fetching Events" });
  }
}

export async function issueCertificate(req: Request, res: Response) {
  try {
    const { eid } = req.params;

    const EventId = parseInt(eid!);

    const teams = await prisma.team.findMany({
      where: {
        eventId: EventId,
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

    if (teams.length === 0) {
      throw new HTTPError(404, "No Teams Found");
    }

    const participants = teams.flatMap((team) => {
      return team.TeamMembers.map((member) => {
        return {
          userId: member.userId,
          EventId,
        };
      });
    });

    await prisma.certificateIssue.createMany({
      data: participants,
      skipDuplicates: true,
    });

    res.status(200).send({ msg: "Certificates Issued" });
  } catch (err: unknown) {
    console.log(err);
    if (err instanceof HTTPError) {
      res.status(err.status).send({ msg: err.message });
      return;
    }
    res.status(500).send({ msg: "Error Issuing Certificates" });
  }
}

export async function getParticipants(req: Request, res: Response) {
  const { eid } = req.params;
  try {
    const eventId = parseInt(eid!);
    const users = await prisma.certificateIssue.findMany({
      where: {
        EventId: eventId,
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
}

export async function markAsSent(req: Request, res: Response) {
  const { cid } = req.params;
  try {
    await prisma.certificateIssue.update({
      where: {
        id: parseInt(cid!),
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
}
