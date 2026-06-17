export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  statusDesc?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginUser {
  userId: string;
  email: string;
  userStatus: string;
}

export interface LoginSuccessData {
  token: string;
  user: LoginUser;
  codigoRespuesta: number;
}

export interface LoginErrorData {
  codigoRespuesta: number;
  userId?: string;
  phone?: string;
  email?: string;
}

export interface CreateAccountData {
  name: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  fotoPerfilBase64: string;
  indicativo: string;
  username?: string;
  birthDate?: string;
}

export interface OtpAction {
  action: 'generate' | 'verify' | 'sendActivationLink' | 'sendResetLink' | 'verifyLink' | 'resetPasswordWithToken';
  email: string;
  userId: string;
  phoneNumber?: string;
  otp?: string;
  token?: string;
  purpose?: 'activation' | 'reset';
  newPassword?: string;
  sendVia?: string | string[];
}

export interface Preference {
  id: number;
  name: string;
  description?: string;
}

export interface UserPreference {
  userId: string;
  preferences: number[];
  createEvents?: string;
  provideServices?: string;
  havePlace?: string;
}

export interface UserPreferenceQuestion {
  createEvents: string;
  attendEvents: string;
  sellTickets: string;
}

export const DEFAULT_PROFILE_IMAGE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAEQAAABECAYAAAA4E5OyAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAVKSURBVHgB7Zzfb9tUFMdP3PRHIlHKitAkQHiaNqG9tBUF0ReWwQMPIFFeKiVVNfoXbP0L1v0FZX9BO7Vp+kb2F5DBw5B4aIL21DHqQkFl0kpWpPVHqnbn611ni2NndhxfO/Y+Umov9trcb84599zrc2+CJLG4uKj29fVl+HQ0kUh8gKO4pJpu1fhVPT09rfKxwveu83llenq6TBJIkE+wAEMswCSfXuZG4ThE3oBAJX4VDw8P78zOzlbJBzouyPLyckZRlEkW4Sp5F8EW/v1LJycntzptOR0TRAhxgz9ohiTC7lRiYW7OzMyUqAN4FiSfzyMWLMgWwgz//eLBwcEcu5JGHmhbEMSIgYGBa/wNzVOIYGHms9nsTWqTtgRBj9Hf3/8DvegpwobGgfdKO9aikEtWV1evshjrFF4xAL6wdf6s18klrgQpFAo3+LBEPvYeHQSfcUF8Zsc4dhn84rDFC6e4iSuOBOlmMQycivJKQaIghoETUVoKsra2do2Tnu8pWnyXy+Vu2120FUR0rehNuiGAuqHKXfKYXZds28uwGD9S9MQAQ8ihkFhaXbQURHRVKkWXUR6JW+YoTS4jXGWTYgB3FmPm0XKThbAYCxQfmtraIAiG8HyYpJiAEbpoc50GQTCfQTHD3Oa6IBw7RoOe0wgCs5XUBeHY4XpkGBUw5Wmc670M+mQW5D+KL0jWzmHiWrcQMTseZ4wnBJTED/ajbygAarUabWp/0vb23/T06T6lUil6e/gMXbhwntLpFMmE3eYyH5aMGJIhyUCAn36+Rxsbv+vnYH9/n/5ice798mv9PVlwkqZbSAK9ixjESaVSua833o6zZ9+h8Y/GSCbsKecU9h3pc6O12nFLMcDOziPdpWTCUx0ZuIx8QY6dNRQuJJlRCDJCIQVBViYcWFWF/Ub6nEeaGzrMvUkrBgffoN7eXpIJB9YRWEggk0CXLn1IyWTS8hreHx+XG1ANIIhKAfAmW8DExCdNbjF85i39/bRkdxGoSQoQiPLF55/Rk73/6Zh7FIgjOyEzE6ggBhAmLAQuCDLS3d1d/TzJQTSdGuCAOkhBAUE0CiCO/LG5RZq2ZZmiw3UuXjxP77/3LklGk24hEKDy2316/HjX9h4kZEjtNzYe0sSnH8uMK/rwX0p1H4AYGLi1EuNlIAzul5XCo/JR4R9bJIkHDx66Tsd1a2GLkkRFmoXAKl41oLMDAz2nVuUF1MRy+q6USALb2/+QF3b+fUR+wxlyRclmsxo9L4r1lSd7e+QFWInPVKempsrGjNkd8pk9zka94PdUALvLXRz1bhfFr6Ly2De+/upLCjOsAaoqnz+XOTo6KpIEtwkzqJ/HURcEzyNYodsUU1A3bywmqD+54/nEIsWUnp6eW8Z5XRAUzyOWUMxAm9G7GP9uePqPVQUUM8xtbhAkhlZSNC8rsaoxm6OYwMG0qa1NgqDmiq0k8q6DNoosvQHLKkTOS1CsK21aIAA0/uLnrS5YCoI+mc3pW4pmsoa2XbG7aFu4C3Nis4piPLF0FYOW62XYrJaiFE/Qllwu17J239HykHw+P89m1tUVihDDLm68jOMFRN0silMxgKtFiN0oihsxgOtVmSsrK9dFsWvYV0pgBD+HOOjmP7W1TLVQKKj8x7B8RKVwUkba0Ko3scPTyu4wuhBcBIllu5sleF7qLqwFqwoCrXUVg9I5r5sjvN4MwUTHt8vA5ggsCurm/Zy01qc8McvXKSEMfN9QRVRJZ6gDG6qwCJjmvItJ8a7ZUMUOsa2G8RoRxX54qaZbNXEsi+fOZRag5HUbDKc8A7wyPuDbnAlUAAAAAElFTkSuQmCC';
