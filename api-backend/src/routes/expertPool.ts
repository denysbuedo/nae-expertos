import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all expert pool entries
router.get('/', async (req: Request, res: Response) => {
  try {
    const { active } = req.query;
    const where: any = {};
    if (active !== undefined) where.active = active === 'true';

    const expertPool = await prisma.expertPool.findMany({
      where,
      include: {
        profiles: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: { lastName: 'asc' },
    });

    res.json(expertPool);
  } catch (error) {
    console.error('Error in GET /expert-pool:', error);
    res.status(500).json({ error: 'Error fetching expert pool entries' });
  }
});

// Get expert pool entry by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const entry = await prisma.expertPool.findUnique({
      where: { id },
      include: {
        profiles: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!entry) {
      return res.status(404).json({ error: 'Expert pool entry not found' });
    }

    res.json(entry);
  } catch (error) {
    console.error('Error in GET /expert-pool/:id:', error);
    res.status(500).json({ error: 'Error fetching expert pool entry' });
  }
});

// Create expert pool entry
router.post('/', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, institution, profileIds, notes, active } = req.body;

    if (!profileIds || !Array.isArray(profileIds) || profileIds.length === 0) {
      return res.status(400).json({ error: 'Se requiere al menos un perfil (profileIds)' });
    }

    const entry = await prisma.expertPool.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        institution,
        notes,
        active: active !== undefined ? active : true,
        profiles: {
          create: profileIds.map((profileId: string) => ({
            profile: { connect: { id: profileId } },
          })),
        },
      },
      include: {
        profiles: {
          include: {
            profile: true,
          },
        },
      },
    });

    res.status(201).json(entry);
  } catch (error: any) {
    console.error('Error in POST /expert-pool:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }
    res.status(500).json({ error: 'Error creating expert pool entry' });
  }
});

// Update expert pool entry
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, institution, profileIds, notes, active } = req.body;

    // Update the expert pool entry
    const entry = await prisma.expertPool.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone,
        institution,
        notes,
        active,
      },
    });

    // Update profile associations if provided
    if (profileIds && Array.isArray(profileIds)) {
      // Delete existing profile links
      await prisma.expertPoolProfile.deleteMany({
        where: { expertId: id },
      });

      // Create new profile links
      if (profileIds.length > 0) {
        await prisma.expertPoolProfile.createMany({
          data: profileIds.map((profileId: string) => ({
            expertId: id,
            profileId,
          })),
        });
      }
    }

    // Fetch the updated entry with profiles
    const updatedEntry = await prisma.expertPool.findUnique({
      where: { id },
      include: {
        profiles: {
          include: {
            profile: true,
          },
        },
      },
    });

    res.json(updatedEntry);
  } catch (error) {
    console.error('Error in PUT /expert-pool/:id:', error);
    res.status(500).json({ error: 'Error updating expert pool entry' });
  }
});

// Delete expert pool entry
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.expertPool.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error in DELETE /expert-pool/:id:', error);
    res.status(500).json({ error: 'Error deleting expert pool entry' });
  }
});

export default router;
