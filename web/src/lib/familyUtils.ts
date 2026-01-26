import { FamilyMember } from "@/services/familyService";

export type UzbekRelationship =
    | "Ota"
    | "Ona"
    | "O'g'il"
    | "Qiz"
    | "Aka"
    | "Uka"
    | "Opa"
    | "Singil"
    | "Amaki"
    | "Tog'a"
    | "Amma"
    | "Xola"
    | "Bobo"
    | "Buvi"
    | "Nabira"
    | "Kelin"
    | "Kuyov"
    | "Jiyan"
    | "Qarindosh"
    | "O'zim";

/**
 * Calculates the relationship of 'target' member relative to 'base' member.
 */
export function calculateRelationship(
    target: FamilyMember,
    base: FamilyMember,
    allMembers: FamilyMember[]
): UzbekRelationship {
    if (target.id === base.id) return "O'zim";

    const targetGender = getGender(target);
    const baseGender = getGender(base);

    // 1. Direct Vertical
    if (target.id === base.fatherId) return "Ota";
    if (target.id === base.motherId) return "Ona";
    if (base.id === target.fatherId) return targetGender === 'male' ? "O'g'il" : "Qiz";
    if (base.id === target.motherId) return targetGender === 'male' ? "O'g'il" : "Qiz";

    // 2. Siblings (Same Parents)
    const isSibling = target.fatherId && target.motherId &&
        target.fatherId === base.fatherId &&
        target.motherId === base.motherId;

    if (isSibling) {
        const isOlder = isOlderThan(target, base);
        if (targetGender === 'male') return isOlder ? "Aka" : "Uka";
        return isOlder ? "Opa" : "Singil";
    }

    // 3. Grandparents
    const baseFather = allMembers.find(m => m.id === base.fatherId);
    const baseMother = allMembers.find(m => m.id === base.motherId);

    if (target.id === baseFather?.fatherId || target.id === baseMother?.fatherId) return "Bobo";
    if (target.id === baseFather?.motherId || target.id === baseMother?.motherId) return "Buvi";

    // 4. Grandchildren
    const targetFather = allMembers.find(m => m.id === target.fatherId);
    const targetMother = allMembers.find(m => m.id === target.motherId);

    if (base.id === targetFather?.fatherId || base.id === targetFather?.motherId ||
        base.id === targetMother?.fatherId || base.id === targetMother?.motherId) return "Nabira";

    // 5. Uncles and Aunts (Siblings of Parents)
    // Father's side
    if (base.fatherId) {
        const fatherSiblings = allMembers.filter(m =>
            m.id !== base.fatherId &&
            m.fatherId === baseFather?.fatherId &&
            m.motherId === baseFather?.motherId &&
            m.fatherId != null
        );
        if (fatherSiblings.some(s => s.id === target.id)) {
            return targetGender === 'male' ? "Amaki" : "Amma";
        }
    }
    // Mother's side
    if (base.motherId) {
        const motherSiblings = allMembers.filter(m =>
            m.id !== base.motherId &&
            m.fatherId === baseMother?.fatherId &&
            m.motherId === baseMother?.motherId &&
            m.fatherId != null
        );
        if (motherSiblings.some(s => s.id === target.id)) {
            return targetGender === 'male' ? "Tog'a" : "Xola";
        }
    }

    // 6. In-laws (Kelin/Kuyov)
    // If target is spouse of someone who is my child
    const targetSpouse = allMembers.find(m => m.id === target.spouseId);
    if (targetSpouse && (targetSpouse.fatherId === base.id || targetSpouse.motherId === base.id)) {
        return targetGender === 'female' ? "Kelin" : "Kuyov";
    }

    // 7. Jiyan (Children of siblings)
    const baseSiblings = allMembers.filter(m =>
        m.id !== base.id &&
        m.fatherId === base.fatherId &&
        m.motherId === base.motherId &&
        m.fatherId != null
    );
    if (baseSiblings.some(s => target.fatherId === s.id || target.motherId === s.id)) {
        return "Jiyan";
    }

    return "Qarindosh";
}

function getGender(member: FamilyMember): 'male' | 'female' {
    const role = (member.role || "").toLowerCase();
    if (role.includes('father') || role.includes('son') || role.includes('brother') || role.includes('uncle') || role.includes('grandfather') || role.includes('kuyov')) {
        return 'male';
    }
    if (role.includes('mother') || role.includes('daughter') || role.includes('sister') || role.includes('aunt') || role.includes('grandmother') || role.includes('kelin')) {
        return 'female';
    }
    return 'male'; // Default
}

function isOlderThan(a: any, b: any): boolean {
    const birthA = a.birthDate || a.birth;
    const birthB = b.birthDate || b.birth;
    if (!birthA || !birthB) return false;
    return new Date(birthA) < new Date(birthB);
}
