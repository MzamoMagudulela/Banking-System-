class BankingException(Exception):
    """Base exception for banking business logic errors."""
    pass

class IneligibleAccountError(BankingException):
    pass

class InsufficientFundsError(BankingException):
    pass

class InvalidAmountError(BankingException):
    pass

class SameAccountTransferError(BankingException):
    pass

class DailyLimitExceededError(BankingException):
    pass

class TransactionAlreadyReversedError(BankingException):
    pass

class DuplicateIdempotencyError(BankingException):
    pass
