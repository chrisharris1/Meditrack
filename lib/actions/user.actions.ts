'use server'

import { createUser, registerPatient } from './patient.actions'

export async function createUserAction(userData: CreateUserParams) {
  return await createUser(userData)
}

export async function registerPatientAction(patientData: RegisterUserParams) {
  return await registerPatient(patientData)
}
