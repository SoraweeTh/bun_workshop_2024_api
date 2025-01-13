import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dayjs = require('dayjs');

export const RepairRecordController = {
    list: async () => {
        try {
            const repairRecords = await prisma.repairRecord.findMany({
                include: {
                    device: true,
                    user: true
                },
                orderBy: {
                    id: 'desc'
                }
            });

            let list = [];

            for (const repairRecord of repairRecords) {
                if (repairRecord.engineerId) {
                    const engineer = await prisma.user.findUnique({
                        select: {
                            username: true
                        },
                        where: {
                            id: repairRecord.engineerId
                        }
                    });
                    list.push({ ...repairRecord, engineer});
                } else {
                    list.push(repairRecord);
                }
            }

            return list;
        } catch (err) {
            return err;
        }
    },
    create: async ({body}: {
        body: {
            customerName: string;
            customerPhone: string;
            deviceName: string;
            deviceId: number;
            deviceBarcode: string;
            deviceSerial: string;
            problem: string;
            solving: string;
            expireDate?: Date;
        },
        request: any,
        jwt: any
    }) => {
        try {
            const row = await prisma.repairRecord.create({
                data: body
            });
            
            return { message: 'success', row: row };
        } catch (err) {
            return err;
        }
    },
    update: async ({body, params}: {
        body: {
            customerName: string;
            customerPhone: string;
            deviceName: string;
            deviceId?: number;
            deviceBarcode: string;
            deviceSerial?: string;
            problem: string;
            solving?: string;
            expireDate?: Date;
        },
        params: {
            id: string;
        }
    }) => {
        try {
            await prisma.repairRecord.update({
                where: {
                    id: parseInt(params.id)
                },
                data: body
            });
            return { message: 'success' };
        } catch (err) {
            return err;
        }
    },
    remove: async ({params}: {
        params: {
            id: string;
        }
    }) => {
        try {
            await prisma.repairRecord.update({
                where: {
                    id: parseInt(params.id)
                },
                data: {
                    status: 'inactive'
                }
            });
            return { message: 'success' };
        } catch (err) {
            return err;
        }
    },
    updateStatus: async ({body, params}: {
        body: {
            status: string;
            solving: string;
            engineerId: number;
        },
        params: {
            id: string
        }
    }) => {
        try {
            await prisma.repairRecord.update({
                where: {
                    id: parseInt(params.id)
                },
                data: body
            });
            return { message: 'success' };
        } catch (err) {
            return err;
        }
    },
    receive: async ({body}: {
        body: {
            amount: number,
            id: number,
        }
    }) => {
        try {
            await prisma.repairRecord.update({
                where: {
                    id: body.id
                },
                data: {
                    amount: body.amount,
                    payDate: new Date(),
                    status: 'complete'
                }
            });
            return { message: 'success' };
        } catch (err) {
            return err;
        }
    },
    report: async ({params}: {
        params: {
            startDate: Date;
            endDate: Date;
        }
    }) => {
        try {
            const startDate = new Date(params.startDate);
            const endDate = new Date(params.endDate);

            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            const repairRecords = await prisma.repairRecord.findMany({
                where: {
                    payDate: {
                        gte: startDate,
                        lte: endDate
                    },
                    status: 'complete'
                }
            });
            return repairRecords;
        } catch (err) {
            return err;
        }
    },
    dashboard: async ({query}: any) => {
        try {
            const year = parseInt(query.year);
            const month = parseInt(query.month);
            const totalRepairRecord = await prisma.repairRecord.count();
            const totalRepairRecordComplete = await prisma.repairRecord.count({
                where: {
                    status: 'complete'
                }
            });
            const totalRepairRecordNotComplete = await prisma.repairRecord.count({
                where: {
                    status: {
                        not: 'complete'
                    }
                }
            });
            const totalAmount = await prisma.repairRecord.aggregate({
                _sum: {
                    amount: true
                },
                where: {
                    status: 'complete'
                }
            });

            const listDailyIncome = [];
            const totalDaysInMonthAndYear = new Date(year, month, 0).getDate();

            for (let i = 1; i <= totalDaysInMonthAndYear; i++) {
                let startDate = new Date(year + '-' + month + '-' + i);
                startDate.setHours(0, 0, 0, 0);
                
                let endDate = new Date(year + '-' + month + '-' + i);
                endDate.setHours(23, 59, 59, 999);

                const totalIncome = await prisma.repairRecord.aggregate({
                    _sum: {
                        amount: true
                    },
                    where: {
                        payDate: {
                            gte: startDate,
                            lte: endDate
                        },
                        status: 'complete'
                    }
                });

                listDailyIncome.push({
                    data: i,
                    amount: totalIncome._sum.amount ?? 0
                });
            }

            return {
                totalRepairRecord: totalRepairRecord,
                totalRepairRecordComplete: totalRepairRecordComplete,
                totalRepairRecordNotComplete: totalRepairRecordNotComplete,
                totalAmount: totalAmount._sum.amount,
                listDailyIncome: listDailyIncome,
            };
        } catch (err) {
            return err;
        }
    },
    monthlyIncome: async ({query}: {
        query: {
            year: string;
        }
    }) => {
        try {
            const year = parseInt(query.year);
            let listMonthlyIncome = [];

            for (let i = 1; i <= 12; i++) {
                const totalDaysInMonth = dayjs(year + '-' + i + '-01').daysInMonth();
                let startDate = new Date(year + '-' + i + '-01');
                startDate.setHours(0, 0, 0, 0);

                let endDate = new Date(year + '-' + i + '-' + totalDaysInMonth);
                endDate.setHours(23, 59, 59, 999);

                const totalIncome = await prisma.repairRecord.aggregate({
                    _sum: {
                        amount: true
                    },
                    where: {
                        payDate: {
                            gte: startDate,
                            lte: endDate
                        }, status: 'complete'
                    }
                });

                listMonthlyIncome.push({
                    month: i,
                    amount: totalIncome._sum.amount ?? 0
                });
            }

            return listMonthlyIncome;
        } catch (err) {
            return err;
        }
    }
}