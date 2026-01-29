class MetaPromptError(Exception):
    """Base domain error"""


class RoleNotFoundError(MetaPromptError):
    pass


class SchemaNotFoundError(MetaPromptError):
    pass


class InvalidSchemaNameError(MetaPromptError):
    pass


class LibraryFileError(MetaPromptError):
    """Invalid or corrupt library content"""
    pass
