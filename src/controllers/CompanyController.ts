import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const CompanyController = {
    info: async () => {
        const company = await prisma.company.findFirst();

        if (!company) {
            return { message: 'company not found' };
        }

        return company;
    },
    update: async ({body}: {
        body:  {
            name: string;
            address: string;
            phone: string;
            email: string;
            facebookPage: string;
            taxCode: string
        }
    }) => {
        try {
            const company = await prisma.company.findFirst();
            
            if (!company) {
                await prisma.company.create({
                    data: body
                });
            } else {
                await prisma.company.update({
                    where: {
                        id: company.id
                    },
                    data: body
                });
            }

            return { message: 'success' };
        } catch (err) {
            return err;
        }
    }
}


