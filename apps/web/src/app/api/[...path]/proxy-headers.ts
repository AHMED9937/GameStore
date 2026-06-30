export function buildForwardHeaders(request: Headers): Headers {
  const headers = new Headers();

  const contentType = request.get('content-type');
  if (contentType) {
    headers.set('content-type', contentType);
  }

  const accept = request.get('accept');
  if (accept) {
    headers.set('accept', accept);
  }

  const authorization = request.get('authorization');
  if (authorization) {
    headers.set('authorization', authorization);
  }

  return headers;
}
