import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const DeviceController = {
    create: async ({body}: {
        body: {
            name: string;
            barcode: string;
            serial: string;
            expiredDate: Date;
            remark: string;
        }
    }) => {
        try {
            await prisma.device.create({
                data: body
            })
            
            return {message: 'success'};
        } catch (err) {
            return err;
        }
    },
    list: async () => {
        try {
            const devices = await prisma.device.findMany({
                where: {
                    status: 'active'
                },
                orderBy: {
                    id: 'desc'
                }
            });

            return devices;
        } catch (err) {
            return err;
        }
    },
    update: async ({body, params}: {
        body: {
            name: string;
            barcode: string;
            serial: string;
            expiredDate: Date;
            remark: string;
        },
        params: {
            id: string;
        }
    }) => {
        try {
            await prisma.device.update({
                where: {
                    id: parseInt(params.id)
                },
                data: body
            })

            return {message: 'success'};
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
            await prisma.device.update({
                where: {
                    id: parseInt(params.id)
                },
                data: {
                    status: 'inactive'
                }
            })

            return {message: 'success'};
        } catch (err) {
            return err;
        }
    }
}

