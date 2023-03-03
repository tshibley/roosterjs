import { applyFormat } from '../utils/applyFormat';
import { ContentModelEntity } from '../../publicTypes/entity/ContentModelEntity';
import { ContentModelHandler } from '../../publicTypes/context/ContentModelHandler';
import { Entity } from 'roosterjs-editor-types';
import { ModelToDomContext } from '../../publicTypes/context/ModelToDomContext';
import {
    addDelimiters,
    commitEntity,
    createEntityPlaceholder,
    getObjectKeys,
    isBlockElement,
} from 'roosterjs-editor-dom';

/**
 * @internal
 */
export const handleEntity: ContentModelHandler<ContentModelEntity> = (
    doc: Document,
    parent: Node,
    entityModel: ContentModelEntity,
    context: ModelToDomContext
) => {
    const { wrapper, id, type, isReadonly, format } = entityModel;
    const entity: Entity | null =
        id && type
            ? {
                  wrapper,
                  id,
                  type,
                  isReadonly: !!isReadonly,
              }
            : null;

    if (entity) {
        // Commit the entity attributes in case there is any change
        commitEntity(wrapper, entity.type, entity.isReadonly, entity.id);
    }

    if (getObjectKeys(format).length > 0) {
        const span = doc.createElement('span');

        parent.appendChild(span);
        applyFormat(span, context.formatAppliers.segment, format, context);
        parent = span;
    }

    if (!entity) {
        parent.appendChild(wrapper);

        addDelimiterElements(wrapper, isReadonly, context);
    } else {
        // Create a comment as placeholder and insert into DOM tree.
        // If the entity DOM can be reused, the original DOM node will be preserved without any change
        // so that in case there is something that is sensitive to its DOM path (e.g. IFRAME), no need to cause it reloaded.
        // For entity that is not directly under root, later we will replace the comment with its original DOM node
        const placeholder = createEntityPlaceholder(entity);
        parent.appendChild(placeholder);

        addDelimiterElements(placeholder, isReadonly, context);

        // Save the entity DOM wrapper node and its placeholder into context so that later we know how to handle it
        context.entities[entity.id] = wrapper;
    }
};
function addDelimiterElements(
    wrapper: HTMLElement,
    isReadonly: boolean,
    context: ModelToDomContext
) {
    if (context.addDelimiterForEntity && !isBlockElement(wrapper) && isReadonly) {
        addDelimiters(wrapper);
    }
}
