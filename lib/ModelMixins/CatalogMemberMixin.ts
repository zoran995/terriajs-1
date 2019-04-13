import { computed } from 'mobx';
import Constructor from '../Core/Constructor';
import Model from '../Models/Model';
import CatalogMemberTraits from '../Traits/CatalogMemberTraits';

type CatalogMember = Model<CatalogMemberTraits>;

function CatalogMemberMixin<T extends Constructor<CatalogMember>>(Base: T) {
    abstract class CatalogMemberMixin extends Base {
        abstract get type(): string;

        abstract loadMetadata(): Promise<void>

        get hasCatalogMemberMixin() {
            return true;
        }

        @computed
        get nameInCatalog(): string | undefined {
            return super.nameInCatalog || this.name;
        }

        @computed
        get nameSortKey() {
            var parts = (this.nameInCatalog || '').split(/(\d+)/);
            return parts.map(function(part) {
                var parsed = parseInt(part, 10);
                if (parsed === parsed) {
                    return parsed;
                } else {
                    return part.trim().toLowerCase();
                }
            });
        }
    }

    return CatalogMemberMixin;
}

namespace CatalogMemberMixin {
    export interface CatalogMemberMixin extends InstanceType<ReturnType<typeof CatalogMemberMixin>> {}
    export function isMixedInto(model: any): model is CatalogMemberMixin {
        return model && model.hasCatalogMemberMixin;
    }
}

export default CatalogMemberMixin;
