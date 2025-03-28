-- CreateTable
CREATE TABLE "SlackWorkspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlackWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlackBotInstallation" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "botUserId" TEXT NOT NULL,
    "botToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "scope" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlackBotInstallation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SlackBotInstallation_teamId_userId_key" ON "SlackBotInstallation"("teamId", "userId");

-- AddForeignKey
ALTER TABLE "SlackBotInstallation" ADD CONSTRAINT "SlackBotInstallation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlackBotInstallation" ADD CONSTRAINT "SlackBotInstallation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "SlackWorkspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
