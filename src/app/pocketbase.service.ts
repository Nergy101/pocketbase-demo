import { Injectable } from "@angular/core";
import PocketBase, { AuthMethodsList } from "pocketbase";

@Injectable({
    providedIn: "root",
})
export class PocketbaseService {
    private pb: PocketBase;

    constructor() {
        // Initialize the PocketBase client
        this.pb = new PocketBase("https://cloud-republic-demo.pockethost.io/");
    }

    // Example: Get all auth methods
    async getAuthMethods(): Promise<AuthMethodsList> {
        const result = await this.pb.collection("users").listAuthMethods();
        return result;
    }

    // Example: Get records from a collection
    getRecords(collection: string, options?: any) {
        return this.pb.collection(collection).getFullList({
            ...options,
        });
    }

    // Example: Get a single record from
    getRecord(collection: string, id: string, options?: any) {
        return this.pb.collection(collection).getOne(id, {
            ...options,
        });
    }

    // Example: Get a collection
    getCollection(collection: string) {
        return this.pb.collection(collection);
    }

    // Example: Get the auth store
    getAuthStore() {
        return this.pb.authStore;
    }

    // Example: Create a new record in a collection
    createRecord(collection: string, data: any) {
        return this.pb.collection(collection).create(data);
    }

    updateRecord(collection: string, id: string, data: any) {
        return this.pb.collection(collection).update(id, data);
    }

    // Example: Delete a record from a collection
    deleteRecord(collection: string, id: string) {
        return this.pb.collection(collection).delete(id);
    }

    // Example: Authenticate user
    login(email: string, password: string) {
        return this.pb.collection("users").authWithPassword(email, password);
    }

    // Example: Authenticate admin
    loginAdmin(email: string, password: string) {
        return this.pb.collection("admins").authWithPassword(email, password);
    }

    // Example: Log out user
    logout() {
        this.pb.authStore.clear();
    }
}
