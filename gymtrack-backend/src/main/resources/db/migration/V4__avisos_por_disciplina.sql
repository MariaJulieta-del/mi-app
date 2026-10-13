-- Avisos a los alumnos de una disciplina (destinatario = DISCIPLINA)
ALTER TABLE public.notificaciones ADD COLUMN IF NOT EXISTS disciplina_id bigint
    REFERENCES public.disciplinas(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS ix_notificaciones_disciplina ON public.notificaciones (disciplina_id);
