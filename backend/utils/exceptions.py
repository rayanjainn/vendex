class ReelSourceError(Exception): pass
class DownloadError(ReelSourceError): pass
class LoginRequiredError(DownloadError): pass
class RateLimitError(ReelSourceError): pass
class IdentificationError(ReelSourceError): pass
class SearchError(ReelSourceError): pass
