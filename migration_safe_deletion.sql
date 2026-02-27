-- Migration to allow deleting vehicles and drivers while preserving history
-- This adds denormalized columns for plate, model, and name

BEGIN;

-- 1. Add columns to trips (viagens)
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS vehicle_model text;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS vehicle_plate text;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS driver_name text;

-- 2. Add columns to maintenances (manutencoes)
ALTER TABLE public.maintenances ADD COLUMN IF NOT EXISTS vehicle_model text;
ALTER TABLE public.maintenances ADD COLUMN IF NOT EXISTS vehicle_plate text;

-- 3. Add columns to refuelings (abastecimentos)
ALTER TABLE public.refuelings ADD COLUMN IF NOT EXISTS condutor_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL;
ALTER TABLE public.refuelings ADD COLUMN IF NOT EXISTS vehicle_model text;
ALTER TABLE public.refuelings ADD COLUMN IF NOT EXISTS vehicle_plate text;
ALTER TABLE public.refuelings ADD COLUMN IF NOT EXISTS driver_name text;

-- 4. Add columns to checklists
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS vehicle_model text;
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS vehicle_plate text;
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS driver_name text;


-- BACKFILL DATA
UPDATE public.trips t SET 
    vehicle_model = v.model, 
    vehicle_plate = v.plate,
    driver_name = d.name
FROM public.vehicles v, public.drivers d
WHERE t.vehicle_id = v.id AND t.driver_id = d.id;

UPDATE public.maintenances m SET 
    vehicle_model = v.model, 
    vehicle_plate = v.plate
FROM public.vehicles v
WHERE m.vehicle_id = v.id;

UPDATE public.refuelings r SET 
    vehicle_model = v.model, 
    vehicle_plate = v.plate
FROM public.vehicles v
WHERE r.vehicle_id = v.id;

UPDATE public.checklists c SET 
    vehicle_model = v.model, 
    vehicle_plate = v.plate,
    driver_name = d.name
FROM public.vehicles v, public.drivers d
WHERE c.vehicle_id = v.id AND c.driver_id = d.id;


-- UPDATE FK CONSTRAINTS TO ON DELETE SET NULL
-- We need to find the constraint names or use DO blocks to avoid errors

DO $$
BEGIN
    -- Trips
    ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_vehicle_id_fkey;
    ALTER TABLE public.trips ADD CONSTRAINT trips_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE SET NULL;
    
    ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_driver_id_fkey;
    ALTER TABLE public.trips ADD CONSTRAINT trips_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE SET NULL;

    -- Maintenances
    ALTER TABLE public.maintenances DROP CONSTRAINT IF EXISTS maintenances_vehicle_id_fkey;
    ALTER TABLE public.maintenances ADD CONSTRAINT maintenances_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE SET NULL;

    -- Refuelings
    ALTER TABLE public.refuelings DROP CONSTRAINT IF EXISTS refuelings_vehicle_id_fkey;
    ALTER TABLE public.refuelings ADD CONSTRAINT refuelings_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE SET NULL;

    ALTER TABLE public.refuelings DROP CONSTRAINT IF EXISTS refuelings_driver_id_fkey;
    ALTER TABLE public.refuelings ADD CONSTRAINT refuelings_driver_id_fkey FOREIGN KEY (condutor_id) REFERENCES public.drivers(id) ON DELETE SET NULL;

    -- Checklists
    ALTER TABLE public.checklists DROP CONSTRAINT IF EXISTS checklists_vehicle_id_fkey;
    ALTER TABLE public.checklists ADD CONSTRAINT checklists_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE SET NULL;

    ALTER TABLE public.checklists DROP CONSTRAINT IF EXISTS checklists_driver_id_fkey;
    ALTER TABLE public.checklists ADD CONSTRAINT checklists_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE SET NULL;

END $$;

COMMIT;
