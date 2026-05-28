import {UiHeader} from "@/shared/ui/ui-header";
import {CategoryList} from "@/features/category";
import {isAdmin} from "@/shared/lib/auth";


export default async function HomePage() {
    const adminMode = await isAdmin();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <UiHeader/>

            <CategoryList isAdmin={adminMode}/>

        </div>
    );
}