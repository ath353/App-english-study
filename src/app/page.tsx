import { auth, signIn, signOut } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">Học từ vựng</h1>

      {session?.user ? (
        <div className="flex flex-col items-center gap-4">
          {session.user.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt={session.user.name ?? "avatar"}
              className="h-16 w-16 rounded-full"
            />
          )}
          <p>
            Xin chào, <span className="font-semibold">{session.user.name}</span>
          </p>
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button
              type="submit"
              className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-300"
            >
              Đăng xuất
            </button>
          </form>
        </div>
      ) : (
        <form
          action={async () => {
            "use server";
            await signIn("google");
          }}
        >
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Đăng nhập với Google
          </button>
        </form>
      )}
    </main>
  );
}
