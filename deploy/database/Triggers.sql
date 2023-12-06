CREATE OR REPLACE FUNCTION update_last_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."lastModified" = NOW(); -- Ensure the case matches the column name
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER update_resume_last_modified
BEFORE UPDATE ON "Resume"
FOR EACH ROW
EXECUTE FUNCTION update_last_modified_column();

CREATE TRIGGER update_resume_last_modified
BEFORE UPDATE ON "Organization"
FOR EACH ROW
EXECUTE FUNCTION update_last_modified_column();

CREATE TRIGGER update_resume_last_modified
BEFORE UPDATE ON "Role"
FOR EACH ROW
EXECUTE FUNCTION update_last_modified_column();

CREATE TRIGGER update_resume_last_modified
BEFORE UPDATE ON "Achievement"
FOR EACH ROW
EXECUTE FUNCTION update_last_modified_column();
