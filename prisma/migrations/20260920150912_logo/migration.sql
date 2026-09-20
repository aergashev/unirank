-- CreateTable
CREATE TABLE "Logo" (
    "universityId" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,

    CONSTRAINT "Logo_pkey" PRIMARY KEY ("universityId")
);

-- AddForeignKey
ALTER TABLE "Logo" ADD CONSTRAINT "Logo_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;
