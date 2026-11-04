-- Hero video upload (non-destructive, idempotent)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE name = 'hero_video' AND object_id = OBJECT_ID('HomeContent', 'U'))
BEGIN ALTER TABLE HomeContent ADD hero_video NVARCHAR(500) NULL; END
GO
