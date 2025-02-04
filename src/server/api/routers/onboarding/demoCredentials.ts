
// These are the credentials for a very restricted demo service account that only has access to BigQuery Data Viewer and BigQuery Job User roles in the former-prod project. We are making sure to only include a single dataset in the demo integration and set a limit of 1000 rows for each query on this dataset.
export const DEMO_CREDENTIALS = {
  "type": "service_account",
  "project_id": "former-prod",
  "private_key_id": "5486f6ca3649c182a1d6063ea6f1adadacfe59b5",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDfxQCqadvREjWs\ngxdh+rnTF8PxbI5EYXzV2rMzqDKVMTMWJwEPSGgVrVFDc6yHdzCUiQaxd3Yh6O64\ntrGSDd1e5bLDZrBdANbtzKjY8IUw/yqQX6yzcSoWDVMKnhezPCb0g8ML10DP5Gvy\nzRMrhFFmImyZIDyvaNxF41mOaMeCv4qpVTnzqDATRUdvFi+JbN0hOQ/qIdy2FV3b\n07tUpjyJwCBcT+vcQAaJu2AQI6LQNy/ppR5bo4qc++1Kmg3YsSFmYEecyNQeuzR2\nrHzGQqNQ8wtRhAn7fp81voX3jVh+/1s3wkvALndZBpxvn9bv3cGnkbQ4Lzzke8Hr\nQUbKsu6hAgMBAAECggEAE9nZ4sRMV1vg5HwNEkiYI2IyCq26+zvIw5hiTS/B+QFD\ncaO/kNFqeZqfOtDwTWSYXzAlJo/QX4nwYsH2UI/BUGT0YShJdtHkJalokZvYvQC0\nXNikxsoM76YT9IoTOsSYOH9xFkPswH4x/PkOlwEAgmm4YTP+awAHvOPb2VA+e42d\nVjCHYFtkomIOfoo7pWKTdgwFyTehxDMGpqKK4PQh7aD1BPGB8JZF7zobtcdUNf91\nrhRTNo5KTCgajeaYUUVkPlbw4cAP38LWPsh5p27bOC2EAwfPq7NEwN8B3uqe+pzB\nk7hsgPhyc5UXv6F98jH/XjkP7GR5S5mHcVo3jfyydwKBgQD8aH6V9q/YQxTA6lJT\nrt6S/E6EmT7dseuSYup+bTG52TIUfpxjy0VDT24n/j2sZfvE41QPnBLaQLMIYHJ8\nmOWcGZPhJDDOPzxaztEkgOAKLkF1OMXc6YZBr0Cn3ovpliRUHavr0wgmi8wLfHy3\ncDltBuhjt34vqnEQzvnaAQW6UwKBgQDi9C32diPKSQuyoEMZkHmH3Qi0d4Y72r4I\nN3vO10SwDbXhXs2ZdHheVhau6fjuoz39k3U3pFyghj0ftN+Isfh7Rt9TD92AJ4cT\nP8tMOlHA5BCas03tuGOQc5TcBK9ch2xsV50kxOJa5IG64psL2zbVGHsk+onHmpYN\ncn3n63pcuwKBgQCsRroXqx8MUYTJw2VbnqBl3HXPBTWmZTivWnpIvkjRW5BV8rDV\nYDkvHvjFrT70+0qjcLHAUbuAYeaQkhuyNT2KlN6dLXFuZDTSmhSfgKLp7/ZXht9t\nz6oGDRLpQPln/kVfcD0WoZwPix1Cvb32Ck/3vV5CKUykRgYT/eEEzevV5wKBgDir\n+rI5i/ReSyJ+rGK81ewcQKk303gsxhktKahbztYbhlhRoQt5rvj3jFB/Ml78umUQ\npkuPqmWXP7okI1FyB3dZGjkWlBwFQtCGtJBDW9jL2m2W6pW63nnasshCDzwOwP9I\n3X+p/k/uEYsGPOs4ATgzFcUFHtSOAHw5I8F+5p4zAoGAc9k8rgtBRgZ7oBD6TQKJ\nZZBzXxE9anUoDD2pkPBGs3NyB6E9xhpoE7kBbEad/S7QynkpUOsPdz0lJaMbYptk\nG6IJfDU8pBqAXig/C+37CJZ7pvG8C9TZ+b7T1Ohu6XEcHGOMx2N2B3r8mF40JEUm\nT9trzOpOFcr6Vlu/5BY2zGI=\n-----END PRIVATE KEY-----\n",
  "client_email": "former-demo-bigquery-read-only@former-prod.iam.gserviceaccount.com",
  "client_id": "108854828103841131087",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/former-demo-bigquery-read-only%40former-prod.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};
