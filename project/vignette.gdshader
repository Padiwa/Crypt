// Vignette plein écran — Godot 4 (renderers Mobile et Compatibility)
// À appliquer sur un ColorRect plein écran, dans un CanvasLayer au-dessus du jeu.
// IMPORTANT : régler le ColorRect sur Mouse > Filter = Ignore, sinon il bloque le tactile.
shader_type canvas_item;

// Force globale de l'effet (0 = aucun, 1 = bords totalement teintés)
uniform float intensity : hint_range(0.0, 1.0) = 0.65;
// Distance au centre où le noircissement est maximal (0.707 = coins de l'écran)
uniform float radius : hint_range(0.1, 1.5) = 0.8;
// Largeur du dégradé : plus c'est grand, plus la transition est douce
uniform float softness : hint_range(0.01, 1.0) = 0.5;
// Couleur des bords : un noir légèrement violet renforce l'ambiance dark fantasy
uniform vec4 vignette_color : source_color = vec4(0.02, 0.0, 0.03, 1.0);

void fragment() {
	// Distance au centre en coordonnées d'écran : vignette elliptique,
	// qui s'adapte aussi bien au portrait qu'au paysage.
	float d = length(UV - vec2(0.5));
	float amount = smoothstep(radius - softness, radius, d);
	COLOR = vec4(vignette_color.rgb, amount * intensity);
}
