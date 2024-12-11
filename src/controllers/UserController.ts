import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const UserController = {
    signIn: async ({body, jwt}: {
        body: {
            username: string;
            password: string;
        },
        jwt: any
    }) => {
        try {
            const user = await prisma.user.findUnique({
                select: {
                    id: true,
                    username: true,
                    level: true
                },
                where: {
                    username: body.username,
                    password: body.password,
                    status: "active"
                },
            });

            if (!user) {
                return { message: 'Invalid username or password.' };
            }

            const token = await jwt.sign(user);

            return { token: token, user: {username: user.username, level: user.level} };
        } catch (err) {
            return err;
        }
    },
    update: async ({body, request, jwt}: {
        body: {
            username: string;
            password: string;
        },
        request: any,
        jwt: any
    }) => {
        try {
            const headers = request.headers.get('Authorization');
            const token = headers?.split(" ")[1];
            const payload = await jwt.verify(token);
            const id = payload.id;
            const oldPass = await prisma.user.findUnique({
                select: {
                    password: true
                },
                where: {id}
            });

            const newData = {
                username: body.username,
                password: body.password == "" ? oldPass?.password : body.password
            }

            await prisma.user.update({
                where: {id},
                data: newData
            })

            return { message: "success"};
        } catch (err) {
            return err;
        }
    },
    list: async () => {
        try {
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    username: true,
                    level: true,
                    section: {
                        select: {
                            id: true,
                            name: true,
                            department: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                },
                where: {
                    status: 'active'
                },
                orderBy: {
                    id: 'desc'
                }
            });
            return users;
        } catch (err) {
            return err;
        }
    },
    updateUser: async ({body, params}: {
        body: {
            username: string,
            password: string,
            level: string,
            sectionId: number,
        },
        params: {
            id: string
        }
    }) => {
        try {
            const oldPass = await prisma.user.findUnique({
                select: {
                    password: true
                },
                where: {
                    id: parseInt(params.id)
                }
            });

            const newData = {
                username: body.username,
                password: body.password == "" ? oldPass?.password : body.password,
                level: body.level,
                sectionId: body.sectionId
            };

            await prisma.user.update({
                where: {
                    id: parseInt(params.id),
                },
                data: newData
            });
            
            return { message: 'success' };
        } catch (err) {
            return err;
        }
    },
    create: async ({body}: {
        body: {
            username: string,
            password: string,
            level: string,
        }
    }) => {
        try {
            await prisma.user.create({
                data: body
            });
            return { message: 'success' };
        } catch (err) {
            return err;
        }
    },
    remove: async ({params}: {
        params: {
            id: string
        }
    }) => {
        try {
            await prisma.user.update({
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
    }
}