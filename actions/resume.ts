"use server";

import { prisma } from "@/prisma/client";
import { IdSchemaType } from "@/schemas/id";
import { ResumeInputType, resumeSchema } from "@/schemas/resume";
import { ParentItemListType } from "@/types/parentItemList";
import { ResumeItemServerToClientType, ResumeListServerOutputType } from "@/types/resume";
import { ModificationTimestampType } from "@/types/timestamp";
import { v4 } from "uuid";
import { getCurrentUser } from "./user";
export const getResumeId = () => {
  return v4();
};

export async function createResume(data: ResumeInputType) {
  const validation = resumeSchema.safeParse(data);

  if (!validation.success) {
    throw new Error("Data to create resume failed validation");
  }

  console.log(`CreateResume from resumeData:`, data);

  const resume = await prisma.resume.create({
    data,
  });

  if (!resume) {
    throw new Error("Creating resume failed on backend");
  }

  if (!resumeSchema.safeParse(resume)) {
    throw new Error("Created resume but backend data failed validation");
  }

  return resume;
}

export async function getResumeItemList(
  parentId: IdSchemaType,
): Promise<ParentItemListType<ResumeItemServerToClientType>> {
  return await prisma.$transaction(async (prisma) => {
    // Retrieve the user with its lastModified timestamp
    const user = await prisma.user.findUnique({
      where: { id: parentId },
      select: { lastModified: true },
    });

    if (!user) throw new Error(`User with ID ${parentId} not found.`);

    // Retrieve the resumes for the user
    const items = await prisma.resume.findMany({
      where: { parentId },
      orderBy: { name: "asc" },
    });

    // Return the combined object
    return {
      parentId: parentId,
      lastModified: user.lastModified,
      items: items,
    } as ParentItemListType<ResumeItemServerToClientType>;
  });
}

export async function getResumeList(parentId: IdSchemaType): Promise<ResumeListServerOutputType> {
  return await prisma.$transaction(async (prisma) => {
    // Retrieve the user with its lastModified timestamp
    const user = await prisma.user.findUnique({
      where: { id: parentId },
      select: { lastModified: true },
    });

    if (!user) throw new Error(`User with ID ${parentId} not found.`);

    // Retrieve the resumes for the user
    const items = await prisma.resume.findMany({
      where: { parentId: parentId },
      orderBy: { name: "asc" },
    });

    // Return the combined object
    return {
      parentId,
      lastModified: user.lastModified,
      items: items,
    } as ResumeListServerOutputType;
  });
}

export async function getResumeById(id: IdSchemaType) {
  if (!id) {
    throw Error;
  }
  const user = await getCurrentUser();

  return user
    ? await prisma.resume.findUnique({
        where: {
          parentId: user.id,
          id,
        },
      })
    : null;
}

export async function getResumeLastModifiedById(id: IdSchemaType): Promise<ModificationTimestampType> {
  if (!id) {
    throw Error;
  }
  const resume = await getResumeById(id);
  return resume?.lastModified as ModificationTimestampType;
}

export async function updateResumeContent(id: IdSchemaType, jsonContent: string) {
  const user = await getCurrentUser();

  return user
    ? await prisma.resume.update({
        where: {
          parentId: user.id,
          id,
        },
        data: {
          content: jsonContent,
        },
      })
    : null;
}

// export async function mergeClientResumeListWithServerOld(
//   resumeList: ResumeListServerInputType,
// ): Promise<ResumeListServerOutputType | null> {
//   const parentId = resumeList.parentId;
//   const currentTimestamp = new Date();
//   const clientLastModified =
//     resumeList.lastModified < currentTimestamp ? resumeList.lastModified : currentTimestamp;

//   let serverLastmodified = await getUserLastModifiedById(parentId);
//   serverLastmodified =
//     serverLastmodified > currentTimestamp
//       ? new Date(currentTimestamp.getMilliseconds() + 1)
//       : serverLastmodified;

//   if (clientLastModified > serverLastmodified) {
//     // Detect if the client has any resumes not present on the server
//     let ghostResumeDetected = 0;

//     // Incorporate all changes from the client into the server's state
//     const clientResumes = resumeList.resumes;

//     // The resumes covered by the client are set to the clientLastModified timestamp
//     const lastModified = clientLastModified;
//     const updatedResumeList = await prisma.$transaction(async (prisma) => {
//       // Process each resume for update or creation
//       const resumePromises = clientResumes.map(async (resume) => {
//         const resumeInputType = transformToResumeInputType(resume);
//         try {
//           if (resume.id) {
//             if (resume.disposition === ResumeDisposition.Deleted) {
//               await prisma.resume.delete({
//                 where: { id: resume.id },
//               });
//             } else {
//               return await prisma.resume.update({
//                 where: { id: resume.id },
//                 data: { ...resumeInputType, lastModified },
//               });
//             }
//           } else {
//             const newResumeData = { ...resumeInputType, parentId, lastModified };
//             console.log(
//               `mergeClientResumeListWithServer: client sent an resume without "id": create new resume with data:`,
//               newResumeData,
//             );
//             return await prisma.resume.create({
//               data: newResumeData,
//             });
//           }
//         } catch (error) {
//           if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
//             // Ignore not found error
//             console.log(`Resume with id ${resume.id} not found. Ignoring update.`);
//             ++ghostResumeDetected;
//           } else {
//             throw error; // Re-throw other errors
//           }
//         }
//       });

//       await Promise.all(resumePromises);

//       // Fetch updated resumes to ensure we include only existing ones
//       // FIXME: Need to sort based on period spent at resumes, not based on name
//       const resumesAfterUpdate = await prisma.resume.findMany({
//         where: { parentId },
//         orderBy: { name: "asc" },
//       });

//       console.log(
//         `mergeClientResumeListWithServer: client update with clientTimestamp=${dateToISOLocal(
//           clientLastModified,
//         )} applied:\n${clientResumes
//           .map((a) => a.id?.substring(0, 3))
//           .join(", ")}\n.findMany returned ${
//           resumesAfterUpdate.length
//         } resumes:\n${resumesAfterUpdate.map((a) => a.id?.substring(0, 3)).join(", ")}\n`,
//       );

//       let clientResumesIncomplete = false;
//       if (ghostResumeDetected == 0) {
//         // Compare server resumes with client resumes
//         const clientResumeIds = new Set(clientResumes.map((a) => a.id));
//         clientResumesIncomplete = !resumesAfterUpdate.every((serverAch) =>
//           clientResumeIds.has(serverAch.id),
//         );
//       }
//       const clientNeedsUpdate = ghostResumeDetected || clientResumesIncomplete;
//       // Determine the lastModified timestamp based on the comparison
//       const finalLastModified = clientNeedsUpdate ? currentTimestamp : clientLastModified;

//       console.log(
//         `mergeClientResumeListWithServer: update user lastModified from server=${dateToISOLocal(
//           serverLastmodified,
//         )} to finalLastModified=${dateToISOLocal(finalLastModified)}`,
//       );

//       // Update the lastModified timestamp of the User
//       await prisma.user.update({
//         where: { id: parentId },
//         data: { lastModified: finalLastModified },
//       });

//       return {
//         ...resumeList,
//         lastModified: finalLastModified,
//         resumes: resumesAfterUpdate,
//       };
//     });

//     return updatedResumeList;
//   } else if (clientLastModified < serverLastmodified) {
//     const serverResumeList = await getResumeList(parentId);
//     console.log(
//       `mergeClientResumeListWithServer: lastModified of client=${dateToISOLocal(
//         clientLastModified,
//       )} is older than server=${dateToISOLocal(serverLastmodified)}. Return ${
//         serverResumeList.resumes.length
//       } resumes`,
//     );
//     return serverResumeList;
//   }
//   // console.log(
//   //   `mergeClientResumeListWithServer: lastModified of client matches server=${dateToISOLocal(
//   //     serverLastmodified,
//   //   )}`,
//   // );
//   return null;
// }
