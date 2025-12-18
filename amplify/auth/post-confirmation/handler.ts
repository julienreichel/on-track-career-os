import { env } from '$amplify/env/post-confirmation';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { PostConfirmationTriggerHandler } from 'aws-lambda';
import type { Schema } from '../../data/resource';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

export const handler: PostConfirmationTriggerHandler = async (event) => {
  const { userAttributes } = event.request;
  const email = userAttributes.email;
  const id = userAttributes.sub;
  if (!email) {
    throw new Error('Missing required user attribute: email');
  }
  if (!id) {
    throw new Error('Missing required user attribute: sub (id)');
  }
  try {
    await client.models.UserProfile.create({
      id,
      fullName: userAttributes.fullname?.trim() || email,
      owner: `${id}::${id}`,
      primaryEmail: email,
      primaryPhone: userAttributes.phone_number || undefined,
    });
  } catch (err) {
    console.log(err);
  }
  return event;
};
