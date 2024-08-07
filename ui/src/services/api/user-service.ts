import PocketBase, { RecordModel } from 'pocketbase';

export const getUser = async (pb: PocketBase, id: string): Promise<RecordModel> => {
  const user = await pb.collection('users').getOne(id);
  return user as RecordModel;
};

export const getUsers = async (pb: PocketBase): Promise<RecordModel[]> => {
  const users = await pb.collection('users').getFullList();
  return users as RecordModel[];
};

export const createUser = async (pb: PocketBase, data: any): Promise<RecordModel> => {
  const user = await pb.collection('users').create(data);
  return user as RecordModel;
};

export const updateUser = async (pb: PocketBase, id: string, data: any): Promise<void> => {
  await pb.collection('users').update(id, data);
};

export const deleteUser = async (pb: PocketBase, id: string): Promise<void> => {
  await pb.collection('users').delete(id);
};