CREATE OR REPLACE FUNCTION public.update_last_modified_column_if_null()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if lastModified is provided and is not NULL
    IF NEW."lastModified" IS NULL THEN
        -- Update lastModified to the current time
        NEW."lastModified" = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_last_modified_if_null
BEFORE UPDATE ON "Resume"
FOR EACH ROW
EXECUTE FUNCTION update_last_modified_column_if_null();

CREATE TRIGGER update_last_modified_if_null
BEFORE UPDATE ON "Organization"
FOR EACH ROW
EXECUTE FUNCTION update_last_modified_column_if_null();

CREATE TRIGGER update_last_modified_if_null
BEFORE UPDATE ON "Role"
FOR EACH ROW
EXECUTE FUNCTION update_last_modified_column_if_null();

CREATE TRIGGER update_last_modified_if_null
BEFORE UPDATE ON "Achievement"
FOR EACH ROW
EXECUTE FUNCTION update_last_modified_column_if_null();
