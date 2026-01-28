class MetaPromptError(Exception):
    """Base exception for v1"""


class RoleNotFoundError(MetaPromptError):
    pass


class SchemaNotFoundError(MetaPromptError):
    pass


class InvalidSchemaNameError(MetaPromptError):
    pass


class InvalidLibraryFileError(MetaPromptError):
    pass
