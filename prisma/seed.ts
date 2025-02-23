import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const main = async () => {
  await db.emailMonitor.create({
    data: {},
  });

  await db.serverSettings.create({
    data: {},
  });

  const college = await db.college.create({
    data: {
      name: "NMAM Institute of Technology",
      type: "ENGINEERING",
    },
  });

  await db.user.create({
    data: {
      email: "admin@incridea.in",
      name: "ADMIN",
      phoneNumber: "0000000000",
      password: await bcrypt.hash("admin@123", 12),
      isVerified: true,
      role: "ADMIN",
      PaymentOrders: {
        create: {
          orderId: "dummy0",
          amount: 38500,
          type: "EVENT_REGISTRATION",
        },
      },
    },
  });

  const branchRep = await db.user.create({
    data: {
      email: "branchrep@incridea.in",
      name: "BRANCHREP",
      phoneNumber: "0000000000",
      password: await bcrypt.hash("branchrep@123", 12),
      isVerified: true,
      role: "BRANCH_REP",
    },
  });

  const branch = await db.branch.create({
    data: {
      name: "CSE",
      details: "Computer Science and Engineering",
    },
  });

  await db.branchRep.create({
    data: {
      Branch: {
        connect: {
          id: branch.id,
        },
      },
      User: {
        connect: {
          id: branchRep.id,
        },
      },
    },
  });

  const event = await db.event.create({
    data: {
      name: "Test Event",
      category: "CORE",
      // NOTE: RTE will parse description, which might lead to client build fails, hence this example RTE data is used in seed
      description: JSON.stringify({
        blocks: [
          {
            key: "de7u0",
            text: "This is the description for this test event",
            type: "unstyled",
            depth: 0,
            inlineStyleRanges: [],
            entityRanges: [],
            data: {},
          },
        ],
        entityMap: {},
      }),
      fees: 100,
      maxTeams: 10,
      minTeamSize: 2,
      maxTeamSize: 3,
      eventType: "INDIVIDUAL_MULTIPLE_ENTRY",
      image: "",
      published: true,
      venue: "Sadananda",
      Branch: {
        connect: {
          id: branch.id,
        },
      },
      Organizers: {
        create: {
          User: {
            create: {
              email: "organiser@incridea.in",
              name: "ORGANIZER",
              phoneNumber: "0000000000",
              password: await bcrypt.hash("organiser@123", 12),
              isVerified: true,
              role: "ORGANIZER",
              College: {
                connect: {
                  id: college.id,
                },
              },
            },
          },
        },
      },
    },
  });

  const round1 = await db.round.create({
    data: {
      roundNo: 1,
      eventId: event.id,
      Quiz: {
        create: {
          name: "DSA Quiz",
          description: "This is a quiz on Data Structures and Algorithms",
          password: "1234",
          overridePassword: "1111",
          startTime: new Date(),
          endTime: new Date(),
          qualifyNext: 10,
          points: 2,
          Questions: {
            create: [
              {
                question: "Which data structure is used for implementing LIFO?",
                options: {
                  create: [
                    {
                      value: "Queue",
                      isAnswer: false,
                    },
                    {
                      value: "Stack",
                      isAnswer: true,
                    },
                    {
                      value: "Array",
                      isAnswer: false,
                    },
                    {
                      value: "Linked List",
                      isAnswer: false,
                    },
                  ],
                },
                isCode: true,
                description: `stack = Stack()\n
stack.push(1) \n
stack.push(2) \n
stack.push(3) \n

print(stack.pop())  # 3 (Last In, First Out) \n
print(stack.pop())  # 2 \n
print(stack.pop())  # 1 \n
print(stack.pop())`,
              },
              {
                question:
                  "Which algorithm is used to find the shortest path in a graph?",
                options: {
                  create: [
                    {
                      value: "Merge Sort",
                      isAnswer: false,
                    },
                    {
                      value: "Dijkstra's Algorithm",
                      isAnswer: true,
                    },
                    {
                      value: "Quick Sort",
                      isAnswer: false,
                    },
                    {
                      value: "Binary Search",
                      isAnswer: false,
                    },
                  ],
                },
                isCode: true,
                description: `graph = { \n
  'A': {'B': 1, 'C': 4}, \n
  'B': {'A': 1, 'C': 2, 'D': 5}, \n
  'C': {'A': 4, 'B': 2, 'D': 1}, \n
  'D': {'B': 5, 'C': 1} \n
}
  `,
              },
              {
                question:
                  "Which sorting algorithm has the best average case time complexity?",
                options: {
                  create: [
                    {
                      value: "Bubble Sort",
                      isAnswer: false,
                    },
                    {
                      value: "Insertion Sort",
                      isAnswer: false,
                    },
                    {
                      value: "Merge Sort",
                      isAnswer: true,
                    },
                    {
                      value: "Selection Sort",
                      isAnswer: false,
                    },
                  ],
                },
                isCode: true,
                description: `def merge_sort(arr): \n
  if len(arr) > 1: \n
                
    mid = len(arr) // 2 \n
    L = arr[:mid] \n
    R = arr[mid:] \n
    `,
              },
              {
                question: "Which data structure is used for implementing FIFO?",
                options: {
                  create: [
                    {
                      value: "Stack",
                      isAnswer: false,
                    },
                    {
                      value: "Queue",
                      isAnswer: true,
                    },
                    {
                      value: "Tree",
                      isAnswer: false,
                    },
                    {
                      value: "Graph",
                      isAnswer: false,
                    },
                  ],
                },
                isCode: true,
                description: `queue = Queue() \n
queue.put(1) \n
queue.put(2) \n
queue.put(3) \n
`,
              },
              {
                question:
                  "Which algorithm is used for finding the minimum spanning tree?",
                options: {
                  create: [
                    {
                      value: "Kruskal's Algorithm",
                      isAnswer: true,
                    },
                    {
                      value: "Binary Search",
                      isAnswer: false,
                    },
                    {
                      value: "Quick Sort",
                      isAnswer: false,
                    },
                    {
                      value: "Dijkstra's Algorithm",
                      isAnswer: false,
                    },
                  ],
                },
                isCode: true,
                description: `graph = { \n
  'A': {'B': 1, 'C': 4}, \n
  'B': {'A': 1, 'C': 2, 'D': 5}, \n
  'C': {'A': 4, 'B': 2, 'D': 1}, \n
  'D': {'B': 5, 'C': 1} \n
}`,
              },
              {
                question:
                  "Which data structure is used for implementing recursion?",
                options: {
                  create: [
                    {
                      value: "Queue",
                      isAnswer: false,
                    },
                    {
                      value: "Stack",
                      isAnswer: true,
                    },
                    {
                      value: "Array",
                      isAnswer: false,
                    },
                    {
                      value: "Linked List",
                      isAnswer: false,
                    },
                  ],
                },
                isCode: true,
                description: `def factorial(n): \n
  if n == 0: \n
                
                
    return 1   \n
  else: \n
    return n * factorial(n-1)
                  `,
              },
              {
                question:
                  "Which algorithm is used for sorting in O(n log n) time complexity?",
                options: {
                  create: [
                    {
                      value: "Bubble Sort",
                      isAnswer: false,
                    },
                    {
                      value: "Merge Sort",
                      isAnswer: true,
                    },
                    {
                      value: "Insertion Sort",
                      isAnswer: false,
                    },
                    {
                      value: "Selection Sort",
                      isAnswer: false,
                    },
                  ],
                },
                isCode: true,
                description: `def merge_sort(arr): \n
  if len(arr) > 1: \n
  print(arr) \n
                `,
              },
              {
                question:
                  "Which data structure is used for implementing priority queue?",
                options: {
                  create: [
                    {
                      value: "Stack",
                      isAnswer: false,
                    },
                    {
                      value: "Heap",
                      isAnswer: true,
                    },
                    {
                      value: "Array",
                      isAnswer: false,
                    },
                    {
                      value: "Linked List",
                      isAnswer: false,
                    },
                  ],
                },
                isCode: true,
                description: `import heapq \n
heap = [] \n
heapq.heappush(heap, 1) \n
heapq.heappush(heap, 2) \n
heapq.heappush(heap, 3) \n
`,
              },
              {
                question:
                  "Which algorithm is used for finding the longest common subsequence?",
                options: {
                  create: [
                    {
                      value: "Binary Search",
                      isAnswer: false,
                    },
                    {
                      value: "Dynamic Programming",
                      isAnswer: true,
                    },
                    {
                      value: "Quick Sort",
                      isAnswer: false,
                    },
                    {
                      value: "Merge Sort",
                      isAnswer: false,
                    },
                  ],
                },
              },
              {
                question:
                  "Which data structure is used for implementing graph traversal?",
                options: {
                  create: [
                    {
                      value: "Stack",
                      isAnswer: false,
                    },
                    {
                      value: "Queue",
                      isAnswer: true,
                    },
                    {
                      value: "Array",
                      isAnswer: false,
                    },
                    {
                      value: "Linked List",
                      isAnswer: false,
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    },
  });

  const round2 = await db.round.create({
    data: {
      roundNo: 2,
      eventId: event.id,
    },
  });

  const judge1 = await db.user.create({
    data: {
      email: "judge1@incridea.in",
      name: "JUDGE 1",
      phoneNumber: "0000000000",
      password: await bcrypt.hash("judge1@123", 12),
      isVerified: true,
      role: "JUDGE",
      collegeId: college.id,
    },
  });

  const judge2 = await db.user.create({
    data: {
      email: "judge2@incridea.in",
      name: "JUDGE 2",
      phoneNumber: "0000000000",
      password: await bcrypt.hash("judge2@123", 12),
      isVerified: true,
      role: "JUDGE",
      collegeId: college.id,
    },
  });

  const judge3 = await db.user.create({
    data: {
      email: "judge3@incridea.in",
      name: "JUDGE 3",
      phoneNumber: "0000000000",
      password: await bcrypt.hash("judge3@123", 12),
      isVerified: true,
      role: "JUDGE",
      collegeId: college.id,
    },
  });

  await db.judge.createMany({
    data: [
      {
        eventId: event.id,
        roundNo: 1,
        userId: judge1.id,
      },
      {
        eventId: event.id,
        roundNo: 1,
        userId: judge2.id,
      },
      {
        eventId: event.id,
        roundNo: 2,
        userId: judge3.id,
      },
    ],
  });

  const teamMembers = [
    await db.user.create({
      data: {
        email: "participant1@incridea.in",
        name: "PARTICIPANT 1",
        phoneNumber: "0000000000",
        password: await bcrypt.hash("participant1@123", 12),
        isVerified: true,
        role: "PARTICIPANT",
        collegeId: college.id,
      },
    }),
    await db.user.create({
      data: {
        email: "participant2@incridea.in",
        name: "PARTICIPANT 2",
        phoneNumber: "0000000000",
        password: await bcrypt.hash("participant2@123", 12),
        isVerified: true,
        role: "PARTICIPANT",
        collegeId: college.id,
      },
    }),
    await db.user.create({
      data: {
        email: "participant3@incridea.in",
        name: "PARTICIPANT 3",
        phoneNumber: "0000000000",
        password: await bcrypt.hash("participant3@123", 12),
        isVerified: true,
        role: "PARTICIPANT",
        collegeId: college.id,
      },
    }),
    await db.user.create({
      data: {
        email: "participant4@incridea.in",
        name: "PARTICIPANT 4",
        phoneNumber: "0000000000",
        password: await bcrypt.hash("participant4@123", 12),
        isVerified: true,
        role: "PARTICIPANT",
        collegeId: college.id,
      },
    }),
  ] as const;

  await db.team.create({
    data: {
      name: "Test team 1",
      attended: true,
      confirmed: true,
      EventPaymentOrder: {
        create: {
          orderId: "1234",
          amount: 100,
          status: "SUCCESS",
          paymentData: { name: "Razorpay" },
        },
      },
      Event: {
        connect: {
          id: event.id,
        },
      },
      leaderId: teamMembers[0].id,
      TeamMembers: {
        createMany: {
          data: [
            {
              userId: teamMembers[0].id,
            },
            {
              userId: teamMembers[1].id,
            },
          ],
        },
      },
    },
  });

  await db.team.create({
    data: {
      name: "Test team 2",
      attended: true,
      confirmed: true,
      EventPaymentOrder: {
        create: {
          orderId: "2345",
          amount: 100,
          status: "SUCCESS",
          paymentData: { name: "Razorpay" },
        },
      },
      Event: {
        connect: {
          id: event.id,
        },
      },
      leaderId: teamMembers[2].id,
      TeamMembers: {
        createMany: {
          data: [
            {
              userId: teamMembers[2].id,
            },
            {
              userId: teamMembers[3].id,
            },
          ],
        },
      },
    },
  });

  await db.user.create({
    data: {
      email: "user@incridea.in",
      name: "USER",
      password: await bcrypt.hash("user@123", 12),
      phoneNumber: "0000000000",
      isVerified: true,
    }
  })

  await db.user.create({
    data: {
      email: "jury@incridea.in",
      name: "JURY",
      role: "JURY",
      password: await bcrypt.hash("jury@123", 12),
      phoneNumber: "0000000000",
      isVerified: true,
    }
  })
};

main().catch(console.log);
