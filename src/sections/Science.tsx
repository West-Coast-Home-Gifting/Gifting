export function Science() {
  return (
    <section id="science" data-section="science" className="s-science">
      <div className="s-science__pin">
        <div className="s-science__top">
          <p className="eyebrow">Sleep science</p>
          <h2 className="title title--center" data-reveal="lines">From scattered signals to one clean night.</h2>
        </div>
        <div className="s-science__bottom">
          <p className="body body--center">
            Raw sensor readings are dust. LUMO RING filters them into the few sleep stages that matter and the recovery that follows.
            [PLACEHOLDER: describe your validated method, and cite any studies or validation you can stand behind]
          </p>
          <ul className="stages" aria-label="Sleep stages">
            <li>Awake</li><li>REM</li><li>Light</li><li>Deep</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
