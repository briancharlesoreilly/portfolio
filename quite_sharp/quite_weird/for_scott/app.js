// The interactive presentation is loaded separately so product copy and briefs remain usable.
import('./viewer.js').catch(error=>{console.error(error);document.querySelector('#status').textContent='3D unavailable here. You can still view the render and shop brief.';});
