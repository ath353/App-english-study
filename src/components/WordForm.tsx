import { createWord } from "@/lib/actions/words";

export function WordForm() {
  return (
    <form
      action={createWord}
      className="flex flex-col gap-2 rounded-md border border-gray-300 p-4"
    >
      <input
        name="term"
        placeholder="Từ vựng (vd: apple)"
        required
        className="rounded border border-gray-300 px-3 py-2"
      />
      <input
        name="meaning"
        placeholder="Nghĩa (vd: quả táo)"
        required
        className="rounded border border-gray-300 px-3 py-2"
      />
      <input
        name="ipa"
        placeholder="Phiên âm IPA (vd: /ˈæp.əl/)"
        className="rounded border border-gray-300 px-3 py-2"
      />
      <textarea
        name="example"
        placeholder="Câu ví dụ"
        rows={2}
        className="rounded border border-gray-300 px-3 py-2"
      />
      <button
        type="submit"
        className="self-start rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        Thêm từ
      </button>
    </form>
  );
}
