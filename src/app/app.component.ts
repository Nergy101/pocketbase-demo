import { CommonModule } from "@angular/common";
import { Component, inject, OnDestroy, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AuthMethodsList, AuthModel, AuthProviderInfo } from "pocketbase";
import { PocketbaseService } from "./pocketbase.service";
import { ToastrService } from "ngx-toastr";

@Component({
    selector: "app-root",
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit, OnDestroy {
    userRecords = signal<any[]>([]);
    votesToVote = signal<any[]>([]);

    authMethods?: AuthMethodsList;

    loggedInUser = signal<AuthModel | undefined>(undefined);

    username = "";
    password = "";

    toastr = inject(ToastrService);
    pbService = inject(PocketbaseService);

    // Example: Subscribe to changes in the users and votes collections
    constructor() {
        const user = localStorage.getItem("auth");
        if (user) {
            this.loggedInUser.set(JSON.parse(user));
        }

        // Subscribe to changes in any users record
        this.pbService.getCollection("users").subscribe(
            "*",
            (e) => {
                // add record
                if (e.action === "create") {
                    console.log("User created:", e);
                    this.userRecords.update((currentValue) => [
                        ...currentValue,
                        e.record,
                    ]);
                }
            },
            {
                /* other options like expand, custom headers, etc. */
            },
        );

        this.pbService.getCollection("polls").subscribe("*", async (e) => {
            // add record
            if (e.action === "update") {
                console.log("Vote updated:", e);
                const vote = this.votesToVote().find(
                    (vote) => vote.id === e.record.id,
                );
                const index = this.votesToVote().indexOf(vote!);

                const currentVotes = this.votesToVote();

                e.record.expand = {};
                e.record.expand["created_by"] = await this.pbService.getRecord(
                    "users",
                    e.record["created_by"],
                );

                currentVotes[index] = e.record;
                this.votesToVote.set(currentVotes);
            }
        });
    }

    // Example: setting records
    async ngOnInit(): Promise<void> {
        await this.setRecords();
        await this.setAuthMethods();
        await this.setVotesToVote();
    }

    async login(provider: AuthProviderInfo) {
        await this.pbService
            .getCollection("users")
            .authWithOAuth2({ provider: provider.name });

        console.log("Auth:", this.pbService.getAuthStore().token);

        localStorage.setItem(
            "auth",
            JSON.stringify(this.pbService.getAuthStore().model),
        );

        this.loggedInUser.set(this.pbService.getAuthStore().model);
        this.toastr.success("User logged in successfully");
    }

    async signupOrLogin() {
        if (this.username === "" || this.password === "") {
            this.toastr.error("Username and password are required");
            return;
        }

        try {
            const newUser = await this.pbService.getCollection("users").create({
                username: this.username,
                password: this.password,
                passwordConfirm: this.password, // Required to confirm password during creation
            });

            console.log("User created:", newUser);
            this.toastr.success("User created successfully");
        } catch (e) {
            console.log("User already existed, logging in");
            this.toastr.info("User already existed, logging in");
        }

        // Log the user in
        const authData = await this.pbService
            .getCollection("users")
            .authWithPassword(this.username, this.password);

        console.log("User logged in:", authData);
        this.toastr.success("User logged in successfully");

        this.loggedInUser.set(authData.record);
        await this.setRecords();
    }

    logout() {
        this.pbService.getAuthStore().clear();
        this.loggedInUser.set(undefined);
        localStorage.removeItem("auth");
        console.log("User logged out");
        this.toastr.info("User logged out");
    }

    voteForOptionA(voteId: string) {
        const vote = this.votesToVote().find((vote) => vote.id === voteId);

        if (vote.users_who_voted.includes(this.loggedInUser()!["id"])) {
            this.toastr.error("You have already voted for this poll");
            return;
        }

        this.pbService.updateRecord("polls", vote!.id, {
            option_a: vote!.option_a + 1,
            users_who_voted: [
                ...vote!.users_who_voted,
                this.loggedInUser()!["id"],
            ],
        });
    }

    voteForOptionB(voteId: string) {
        const vote = this.votesToVote().find((vote) => vote.id === voteId);

        if (vote.users_who_voted.includes(this.loggedInUser()!["id"])) {
            this.toastr.error("You have already voted for this poll");
            return;
        }

        this.pbService.updateRecord("polls", vote!.id, {
            option_b: vote!.option_b + 1,
            users_who_voted: [
                ...vote!.users_who_voted,
                this.loggedInUser()!["id"],
            ],
        });
    }

    private async setRecords() {
        this.userRecords.set(
            (await this.pbService.getRecords("users")) as any[],
        );
    }

    private async setAuthMethods() {
        this.authMethods = await this.pbService.getAuthMethods();
    }

    private async setVotesToVote() {
        this.votesToVote.set(
            (await this.pbService.getRecords("polls", {
                expand: "created_by",
            })) as any[],
        );
    }

    ngOnDestroy(): void {
        this.pbService.getCollection("users").unsubscribe("*"); // Unsubscribe from all events
        this.pbService.getCollection("polls").unsubscribe("*"); // Unsubscribe from all events
    }
}
