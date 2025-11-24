import { getAuth } from '@velo/google-sso-integration-backend';

export function get_getAuth(request) {
    return getAuth(request)
      .catch((error) => {
          console.log(error);
      });
}