import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

export default defineNuxtPlugin({
  name: 'AmplifyConfig',
  enforce: 'pre',
  setup() {
    Amplify.configure(outputs, { ssr: true });
  },
});
