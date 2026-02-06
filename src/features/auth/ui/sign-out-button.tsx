import {useSignOut} from "../model/use-sign-out";
import {Button} from "@/shared/ui/Button";

export function SignOutButton({className}: { className?: string }) {
    const {signOut} = useSignOut();

    return (
        <Button
            onPress={() => signOut({})}
            variant="destructive"
            className={className}
        >
            Выход
        </Button>
    );
}
