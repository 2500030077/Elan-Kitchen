import { useParams, useNavigate } from 'react-router-dom';
import { Info, SearchX } from 'lucide-react';
import toast from 'react-hot-toast';
import RecipeForm from '../../components/forms/RecipeForm';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { useRecipes } from '../../context/RecipeContext';
import recipeService from '../../services/recipeService';
import usePageTitle from '../../hooks/usePageTitle';

/** Shared create/edit page for members and (with `admin`) moderators. */
export default function RecipeEditorPage({ admin = false }) {
  const { id } = useParams();
  const editing = !!id;
  const { user } = useAuth();
  const { getRecipe, categories } = useRecipes();
  const navigate = useNavigate();
  const recipe = editing ? getRecipe(id) : null;
  usePageTitle(editing ? 'Edit recipe' : 'Submit a recipe');

  const allowed = !editing || (recipe && (admin || recipe.authorId === user.id));
  if (!allowed) {
    return (
      <EmptyState
        icon={SearchX}
        title="Recipe not found"
        description="This recipe doesn’t exist or you don’t have permission to edit it."
        action={<Button to={admin ? '/admin/recipes' : '/user/recipes'}>Back to recipes</Button>}
      />
    );
  }

  const onSubmit = async (data) => {
    if (editing) {
      const updated = recipeService.updateRecipe(user, id, data);
      toast.success(admin ? 'Recipe updated' : updated.status === 'pending' ? 'Changes saved and sent for review' : 'Recipe updated');
    } else {
      recipeService.createRecipe(user, data);
      toast.success('Recipe submitted! It will appear publicly once approved.');
    }
    navigate(admin ? '/admin/recipes' : '/user/recipes');
  };

  const notice =
    !admin && (
      <div className="flex gap-3 rounded-card border border-gold-light bg-gold-light/30 p-4 text-sm leading-relaxed" role="note">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" aria-hidden="true" />
        <p>
          {editing && recipe.status === 'approved'
            ? 'This recipe is live. Saving changes will send it back to Pending review and hide it from the public until a moderator re-approves it.'
            : editing && recipe.status === 'rejected'
              ? `Moderator feedback: “${recipe.rejectionReason}”. Saving will resubmit it for review.`
              : 'Every submission is reviewed by our editors before it is published. You can track its status in My Recipes.'}
        </p>
      </div>
    );

  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow={admin ? 'Studio · Recipe management' : editing ? 'My recipes' : 'Share your craft'}
        title={editing ? `Edit “${recipe.title}”` : 'Submit a new recipe'}
        description={editing ? 'Update the details below.' : 'Tell the community about a dish you love to cook.'}
      />
      <RecipeForm
        key={id || 'new'}
        initial={recipe}
        categories={categories}
        onSubmit={onSubmit}
        onCancel={() => navigate(-1)}
        submitLabel={admin ? 'Save changes' : editing ? 'Save & resubmit' : 'Submit for review'}
        notice={notice}
      />
    </div>
  );
}
