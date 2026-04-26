const ResourceView = ({
  s,
  h
}) => {
  const {
    activeTab,
    employees,
    projects,
    assignments,
    expenses,
    costItems,
    empCategories,
    projCategories,
    basicTasks,
    basicTasksMeta,
    inactiveBasicTasks,
    basicTasksSubTab,
    offtimeTasks,
    inactiveOfftimeTasks,
    inactiveSupportTasks,
    inactiveTrainingTasks,
    isChangelogOpen,
    weeks,
    selectedProject,
    collapsedCategories,
    collapsedProjCategories,
    collapsedEmpSetup,
    selectedProjectDetails,
    weeksAhead,
    isAssignModalOpen,
    assignContext,
    isCostItemModalOpen,
    editingCostItem,
    isCopyModalOpen,
    copyContext,
    isDeleteMode,
    pastProjectsExpanded,
    isInvoiceModalOpen,
    invoiceSelection,
    invoiceRecipient,
    isProjFormOpen,
    isHelpModalOpen,
    timelineYear,
    empForm,
    editingEmpId,
    projForm,
    editingProjectId,
    newEmpCat,
    newProjCat,
    newBasicTask,
    newOfftimeTask,
    expandedSetupCats,
    syncStatus,
    fsStatus,
    employeeById,
    projectById,
    assignmentsByEmpWeek,
    assignmentsByProject,
    assignmentsByProjectWeek,
    costItemsByProject,
    projectStatusById,
    activeEmployees,
    activeEmpsByCategory,
    activeEmpCategories,
    projectsByCategory,
    projCategoriesFromProjects,
    timelineWeeks,
    currentWeekColRef,
    resourceScrollRef,
    timelineScrollRef
  } = s;
  const {
    setActiveTab,
    setEmployees,
    setProjects,
    setAssignments,
    setCostItems,
    setEmpCategories,
    setProjCategories,
    setBasicTasks,
    setBasicTasksMeta,
    setInactiveBasicTasks,
    setBasicTasksSubTab,
    setOfftimeTasks,
    setInactiveOfftimeTasks,
    setInactiveSupportTasks,
    setInactiveTrainingTasks,
    setIsChangelogOpen,
    setSelectedProject,
    setCollapsedCategories,
    setCollapsedProjCategories,
    setCollapsedEmpSetup,
    setSelectedProjectDetails,
    setWeeksAhead,
    setIsAssignModalOpen,
    setAssignContext,
    setIsCostItemModalOpen,
    setEditingCostItem,
    setIsCopyModalOpen,
    setCopyContext,
    setIsDeleteMode,
    setPastProjectsExpanded,
    setIsInvoiceModalOpen,
    setInvoiceSelection,
    setInvoiceRecipient,
    setIsProjFormOpen,
    setIsHelpModalOpen,
    setTimelineYear,
    setEmpForm,
    setEditingEmpId,
    setProjForm,
    setEditingProjectId,
    setNewEmpCat,
    setNewProjCat,
    setNewBasicTask,
    setNewOfftimeTask,
    setExpandedSetupCats,
    setSyncStatus,
    setFsStatus,
    getEmpWeeklyHours,
    computeAutoStatus,
    getWeeksForYear,
    getUtilization,
    toggleCategory,
    toggleProjCategory,
    toggleEmpSetup,
    handleSaveAssignment,
    handleDeleteAssignment,
    handleDeleteAssignmentSeries,
    handleDrop,
    exportData,
    importData,
    buildInvoiceData,
    openInvoiceModal,
    scrollToCurrentWeek
  } = h;
  const WEEK_W = 140; // matches min-w-[140px]
  const STICKY_W = 288; // matches w-72

  const [scrollInfo, setScrollInfo] = React.useState({
    progress: 0,
    label: ''
  });
  // Horizontal virtualization: only render the body cells for the
  // visible week range (+ buffer). The header keeps all weeks so the
  // table column widths stay stable; body rows use colSpan spacers
  // for the off-screen ranges.
  const [visibleRange, setVisibleRange] = React.useState({
    start: 0,
    end: 25
  });
  const scrollRafRef = React.useRef(null);
  React.useEffect(() => () => {
    if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
  }, []);
  const handleScroll = React.useCallback(e => {
    if (scrollRafRef.current) return;
    const {
      scrollLeft,
      scrollWidth,
      clientWidth
    } = e.currentTarget;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const maxScroll = scrollWidth - clientWidth;
      const progress = maxScroll > 0 ? scrollLeft / maxScroll : 0;
      const firstIdx = Math.max(0, Math.floor(scrollLeft / WEEK_W));
      const lastIdx = Math.min(timelineWeeks.length - 1, firstIdx + Math.floor((clientWidth - STICKY_W) / WEEK_W) - 1);
      const label = timelineWeeks[firstIdx] && timelineWeeks[lastIdx] ? `${timelineWeeks[firstIdx].label} – ${timelineWeeks[lastIdx].label}` : '';
      setScrollInfo({
        progress,
        label
      });
      const BUFFER = 8;
      const newStart = Math.max(0, firstIdx - BUFFER);
      const newEnd = Math.min(timelineWeeks.length - 1, lastIdx + BUFFER);
      setVisibleRange(prev => prev.start === newStart && prev.end === newEnd ? prev : {
        start: newStart,
        end: newEnd
      });
    });
  }, [timelineWeeks]);
  const scrollWeeks = n => resourceScrollRef.current?.scrollBy({
    left: n * WEEK_W,
    behavior: 'smooth'
  });
  const activeCategories = activeEmpCategories;
  const currentWeek = getWeekString(new Date());
  const currentYear = new Date().getFullYear();
  const resourceWeeks = timelineWeeks;
  const [compact, setCompact] = React.useState(false);
  const [empSearch, setEmpSearch] = React.useState('');
  const [empSearchRaw, setEmpSearchRaw] = React.useState('');
  const empDebounceRef = React.useRef(null);
  const displayCategories = React.useMemo(() => {
    if (!empSearch.trim()) return activeCategories;
    const q = empSearch.toLowerCase();
    return activeCategories.filter(cat => {
      const emps = activeEmpsByCategory.get(cat) || [];
      return cat.toLowerCase().includes(q) || emps.some(e => e.name.toLowerCase().includes(q));
    });
  }, [empSearch, activeCategories, activeEmpsByCategory]);
  const getFilteredEmps = React.useCallback(cat => {
    const emps = activeEmpsByCategory.get(cat) || [];
    if (!empSearch.trim()) return emps;
    const q = empSearch.toLowerCase();
    if (cat.toLowerCase().includes(q)) return emps;
    return emps.filter(e => e.name.toLowerCase().includes(q));
  }, [empSearch, activeEmpsByCategory]);
  const monthGroups = React.useMemo(() => {
    const groups = [];
    let cur = null;
    resourceWeeks.forEach(w => {
      if (!cur || cur.month !== w.month) {
        cur = {
          month: w.month,
          count: 1
        };
        groups.push(cur);
      } else {
        cur.count++;
      }
    });
    return groups;
  }, [resourceWeeks]);

  // Clamp visibleRange against the current week list (year switches can
  // shrink it) and derive the slice + spacer widths used by every body
  // row. The clamping happens in render so we don't need a separate
  // effect just to keep the state consistent.
  const safeStart = Math.max(0, Math.min(visibleRange.start, resourceWeeks.length - 1));
  const safeEnd = Math.max(safeStart, Math.min(visibleRange.end, resourceWeeks.length - 1));
  const visibleWeeks = React.useMemo(() => resourceWeeks.slice(safeStart, safeEnd + 1), [resourceWeeks, safeStart, safeEnd]);
  const leftSpacerSpan = safeStart;
  const rightSpacerSpan = Math.max(0, resourceWeeks.length - 1 - safeEnd);
  return /*#__PURE__*/React.createElement("div", {
    className: "flex-1 flex flex-col h-full bg-white overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-4 border-b border-slate-300 bg-gea-50 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-gea-800 text-xl font-semibold"
  }, "Ressourcenplaner"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement(IconUsers, {
    size: 14,
    className: "absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
  }), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: empSearchRaw,
    onChange: e => {
      const v = e.target.value;
      setEmpSearchRaw(v);
      if (empDebounceRef.current) clearTimeout(empDebounceRef.current);
      empDebounceRef.current = setTimeout(() => setEmpSearch(v), 250);
    },
    placeholder: "Mitarbeiter suchen\u2026",
    className: "pl-7 pr-7 py-1.5 border border-slate-300 rounded text-sm bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-gea-400 w-44"
  }), empSearchRaw && /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (empDebounceRef.current) clearTimeout(empDebounceRef.current);
      setEmpSearchRaw('');
      setEmpSearch('');
    },
    className: "absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
  }, /*#__PURE__*/React.createElement(IconX, {
    size: 12
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => scrollWeeks(-4),
    className: "p-1.5 rounded-l bg-gea-100 text-gea-700 hover:bg-gea-200 transition-colors border-r border-gea-200",
    title: "4 Wochen zur\xFCck"
  }, /*#__PURE__*/React.createElement(IconChevronLeft, {
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    className: "px-2 text-xs text-slate-500 bg-gea-50 h-[30px] flex items-center min-w-[130px] justify-center border-y border-gea-100 font-mono tabular-nums"
  }, scrollInfo.label || '—'), /*#__PURE__*/React.createElement("button", {
    onClick: () => scrollWeeks(4),
    className: "p-1.5 rounded-r bg-gea-100 text-gea-700 hover:bg-gea-200 transition-colors border-l border-gea-200",
    title: "4 Wochen vor"
  }, /*#__PURE__*/React.createElement(IconChevronRight, {
    size: 16
  }))), /*#__PURE__*/React.createElement("select", {
    value: timelineYear,
    onChange: e => setTimelineYear(Number(e.target.value)),
    className: "border border-slate-300 rounded px-2 py-1.5 text-sm bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-gea-400"
  }, Array.from({
    length: 7
  }, (_, i) => currentYear - 1 + i).map(y => /*#__PURE__*/React.createElement("option", {
    key: y,
    value: y
  }, y))), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      if (timelineYear !== currentYear) {
        setTimelineYear(currentYear);
        setTimeout(() => scrollToCurrentWeek(resourceScrollRef, 288), 120);
      } else {
        scrollToCurrentWeek(resourceScrollRef, 288);
      }
    },
    className: "px-3 py-1.5 bg-gea-100 text-gea-700 rounded-lg text-sm font-medium hover:bg-gea-200 transition-colors"
  }, "Heute"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setIsHelpModalOpen(true),
    title: "Hilfe & Legende",
    className: "w-8 h-8 flex items-center justify-center rounded-lg border bg-white text-slate-600 border-slate-300 hover:border-gea-400 hover:text-gea-600 transition-colors text-sm font-bold"
  }, "?"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setCompact(c => !c),
    title: compact ? 'Zur Normal-Ansicht wechseln' : 'Zur Kompakt-Ansicht wechseln',
    className: `w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${compact ? 'bg-gea-600 text-white border-gea-600 shadow-sm' : 'bg-white text-slate-600 border-slate-300 hover:border-gea-400 hover:text-gea-600'}`
  }, /*#__PURE__*/React.createElement(IconList, {
    size: 16
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => setIsDeleteMode(m => !m),
    title: isDeleteMode ? 'Löschmodus aktiv — klicken zum Beenden' : 'Löschmodus aktivieren',
    className: `w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${isDeleteMode ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-white text-slate-600 border-slate-300 hover:border-rose-400 hover:text-rose-600'}`
  }, /*#__PURE__*/React.createElement(IconX, {
    size: 16
  })))), /*#__PURE__*/React.createElement("div", {
    className: "h-0.5 bg-slate-100 shrink-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "h-full bg-gea-400 transition-all duration-150",
    style: {
      width: `${scrollInfo.progress * 100}%`
    }
  })), /*#__PURE__*/React.createElement("div", {
    ref: resourceScrollRef,
    className: "flex-1 overflow-auto relative outline-none",
    onScroll: handleScroll,
    tabIndex: -1,
    onKeyDown: e => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollWeeks(-1);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollWeeks(1);
      }
      if (e.key === 'PageUp') {
        e.preventDefault();
        scrollWeeks(-4);
      }
      if (e.key === 'PageDown') {
        e.preventDefault();
        scrollWeeks(4);
      }
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full border-collapse text-sm text-left"
  }, /*#__PURE__*/React.createElement("thead", {
    className: "sticky top-0 bg-white z-20 shadow-sm"
  }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    className: "border-b border-r border-slate-200 w-72 bg-slate-50 sticky left-0 z-30"
  }), monthGroups.map(g => /*#__PURE__*/React.createElement("th", {
    key: g.month,
    colSpan: g.count,
    className: "px-2 py-1 border-b border-r border-slate-200 text-center text-[11px] font-semibold text-gea-700 bg-gea-50/80 uppercase tracking-wide"
  }, g.month))), /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    className: "p-4 border-b-2 border-r border-slate-300 w-72 bg-slate-50 sticky left-0 z-30 text-slate-500 uppercase tracking-wider text-xs font-medium"
  }, "Mitarbeiter"), resourceWeeks.map(w => {
    const isCurrent = w.id === currentWeek;
    const isPast = w.id < currentWeek;
    return /*#__PURE__*/React.createElement("th", {
      key: w.id,
      ref: isCurrent ? currentWeekColRef : null,
      className: `p-3 border-b-2 border-r border-slate-300 min-w-[140px] text-center font-medium ${isCurrent ? 'bg-gea-100 text-gea-800 border-b-gea-500' : isPast ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 text-slate-600'}`
    }, /*#__PURE__*/React.createElement("div", null, w.label), /*#__PURE__*/React.createElement("div", {
      className: "text-[10px] font-normal opacity-70"
    }, w.sub), w.holidays.length > 0 && /*#__PURE__*/React.createElement("div", {
      className: "text-[9px] font-semibold text-amber-600 leading-tight mt-0.5 truncate",
      title: w.holidays.join(' · ')
    }, w.holidays.join(' · ')));
  }))), /*#__PURE__*/React.createElement("tbody", null, displayCategories.map(category => {
    const isCollapsed = !empSearch && collapsedCategories[category];
    const catEmps = getFilteredEmps(category);
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: category
    }, /*#__PURE__*/React.createElement("tr", {
      className: "bg-slate-200/70 border-t-2 border-b border-slate-300 cursor-pointer hover:bg-slate-300/50 transition-colors group",
      onClick: () => toggleCategory(category)
    }, /*#__PURE__*/React.createElement("td", {
      className: "p-3 text-slate-700 sticky left-0 z-20 bg-slate-200 border-r border-l-4 border-l-gea-500 border-slate-300 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2 text-sm uppercase tracking-wider font-medium"
    }, /*#__PURE__*/React.createElement("span", {
      className: "text-slate-400 group-hover:text-gea-500 transition-colors"
    }, isCollapsed ? /*#__PURE__*/React.createElement(IconChevronRight, {
      size: 16
    }) : /*#__PURE__*/React.createElement(IconChevronDown, {
      size: 16
    })), category, /*#__PURE__*/React.createElement("span", {
      className: "ml-auto text-xs bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-500 font-medium"
    }, catEmps.length))), leftSpacerSpan > 0 && /*#__PURE__*/React.createElement("td", {
      colSpan: leftSpacerSpan,
      className: "border-b border-slate-300 bg-slate-200/70"
    }), visibleWeeks.map(w => /*#__PURE__*/React.createElement("td", {
      key: `header-${w.id}`,
      className: "border-b border-slate-300 bg-slate-200/70"
    })), rightSpacerSpan > 0 && /*#__PURE__*/React.createElement("td", {
      colSpan: rightSpacerSpan,
      className: "border-b border-slate-300 bg-slate-200/70"
    })), !isCollapsed && catEmps.map(emp => {
      const empWH = emp.weeklyHours ?? HOURS_PER_WEEK;
      return /*#__PURE__*/React.createElement("tr", {
        key: emp.id,
        className: "hover:bg-slate-50/50 transition-colors"
      }, /*#__PURE__*/React.createElement("td", {
        className: "p-3 border-b border-r border-slate-300 bg-white sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]"
      }, /*#__PURE__*/React.createElement("div", {
        className: "text-slate-800 font-medium text-sm"
      }, emp.name)), leftSpacerSpan > 0 && /*#__PURE__*/React.createElement("td", {
        colSpan: leftSpacerSpan,
        className: "border-b border-r border-slate-300 bg-white"
      }), visibleWeeks.map(w => {
        const {
          total,
          isOfftime,
          assignments: wAss
        } = getUtilization(emp.id, w.id);
        const isOverbooked = total > 100;
        const cellBg = isOfftime ? 'bg-slate-50 diagonal-stripes' : wAss.length === 0 ? 'bg-emerald-50/40' : isOverbooked ? 'bg-rose-50' : total >= 80 ? 'bg-amber-50' : 'bg-emerald-50/60';
        return /*#__PURE__*/React.createElement("td", {
          key: w.id,
          className: `p-1.5 border-b border-r border-slate-300 relative transition-colors group/cell ${isDeleteMode ? 'bg-rose-50/20' : 'cursor-pointer hover:bg-gea-50/30'} ${cellBg} ${w.id === currentWeek ? 'bg-gea-50/50 border-l border-l-gea-300 border-r-gea-300' : ''} ${w.id < currentWeek ? 'opacity-60' : ''}`,
          onClick: () => {
            if (!isDeleteMode) {
              setAssignContext({
                empId: emp.id,
                week: w.id
              });
              setIsAssignModalOpen(true);
            }
          },
          onDragOver: e => {
            if (!isDeleteMode) e.preventDefault();
          },
          onDrop: e => {
            if (!isDeleteMode) handleDrop(e, w.id, emp.id, true);
          }
        }, wAss.length === 0 && !isOfftime && /*#__PURE__*/React.createElement("div", {
          className: "absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 text-gea-300 transition-opacity"
        }, /*#__PURE__*/React.createElement(IconPlus, {
          size: 20
        })), /*#__PURE__*/React.createElement("div", {
          className: `flex flex-col gap-1 relative z-10 ${compact ? 'min-h-[20px]' : 'min-h-[44px]'}`
        }, wAss.map(a => {
          let label = a.reference;
          let color = 'bg-white border-slate-200 text-slate-700';
          let dotColor = 'bg-slate-400';
          if (a.type === 'project') {
            const p = projectById.get(a.reference);
            label = p ? p.name : 'Unbekannt';
            if (p) {
              const pc = resolveProjectColor(p.color);
              color = pc.chip;
              dotColor = pc.dot;
            }
          } else if (a.type === 'support') {
            const sc = SUPPORT_CHIP_COLORS[a.reference];
            if (sc) {
              color = sc.chip;
              dotColor = sc.dot;
            } else {
              color = 'bg-amber-50 border-amber-200 text-amber-800';
              dotColor = 'bg-amber-500';
            }
          } else if (a.type === 'training') {
            color = TRAINING_CHIP_COLOR.chip;
            dotColor = TRAINING_CHIP_COLOR.dot;
          } else if (a.type === 'other') {
            const taskMeta = basicTasksMeta[a.reference];
            if (taskMeta?.color) {
              const tc = resolveProjectColor(taskMeta.color);
              color = tc.chip;
              dotColor = tc.dot;
            } else {
              color = 'bg-slate-50 border-slate-200 text-slate-700';
              dotColor = 'bg-slate-400';
            }
          } else if (a.type === 'offtime') {
            color = 'bg-slate-100 border-slate-300 text-slate-600';
            dotColor = 'bg-slate-500';
          } else if (a.type === 'basic') {
            const taskMeta = basicTasksMeta?.[a.reference];
            if (taskMeta?.color) {
              const tc = resolveProjectColor(taskMeta.color);
              color = tc.chip;
              dotColor = tc.dot;
            }
          }
          const pct = Math.round((a.hours ?? (a.percent ?? 100) / 100 * empWH) / empWH * 100);
          return /*#__PURE__*/React.createElement("div", {
            key: a.id,
            draggable: !isDeleteMode,
            title: a.comment || undefined,
            onDragStart: e => {
              e.stopPropagation();
              e.dataTransfer.setData('assignmentId', a.id);
            },
            onClick: e => {
              e.stopPropagation();
              if (isDeleteMode) {
                handleDeleteAssignment(a.id);
              } else {
                setAssignContext({
                  empId: emp.id,
                  week: w.id,
                  existing: a
                });
                setIsAssignModalOpen(true);
              }
            },
            className: `text-[11px] rounded-md border flex justify-between items-stretch shadow-sm transition-all group/chip overflow-hidden ${isDeleteMode ? 'cursor-pointer hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 hover:line-through' : 'hover:shadow hover:-translate-y-0.5 cursor-grab active:cursor-grabbing'} ${color} ${isOverbooked ? 'ring-1 ring-rose-500 ring-inset' : ''}`
          }, /*#__PURE__*/React.createElement("div", {
            className: "flex items-center gap-1.5 min-w-0"
          }, /*#__PURE__*/React.createElement("div", {
            className: `w-1 flex-shrink-0 self-stretch ${dotColor}`
          }), /*#__PURE__*/React.createElement("span", {
            className: `truncate font-medium px-1 ${compact ? 'py-0.5' : 'py-1.5'}`
          }, label), !compact && a.comment && /*#__PURE__*/React.createElement(IconMessageSquare, {
            size: 9,
            className: "flex-shrink-0 opacity-60"
          }), !compact && a.ruleId && /*#__PURE__*/React.createElement(IconRepeat, {
            size: 9,
            className: "flex-shrink-0 opacity-60"
          })), !compact && /*#__PURE__*/React.createElement("div", {
            className: "flex items-center gap-1 ml-1 flex-shrink-0"
          }, /*#__PURE__*/React.createElement("span", {
            className: "opacity-70 bg-slate-100/50 px-1 rounded font-medium"
          }, pct, "%"), /*#__PURE__*/React.createElement("button", {
            onClick: e => {
              e.stopPropagation();
              setCopyContext({
                assignment: a
              });
              setIsCopyModalOpen(true);
            },
            className: "opacity-0 group-hover/chip:opacity-100 text-slate-400 hover:text-gea-600 transition-opacity p-0.5 rounded",
            title: "Kopieren"
          }, /*#__PURE__*/React.createElement(IconCopy, {
            size: 10
          }))));
        }), !compact && wAss.length > 0 && !isOfftime && /*#__PURE__*/React.createElement("div", {
          onClick: e => {
            e.stopPropagation();
            setAssignContext({
              empId: emp.id,
              week: w.id
            });
            setIsAssignModalOpen(true);
          },
          className: "opacity-0 group-hover/cell:opacity-100 text-[10px] px-2 py-1.5 rounded-md border border-dashed border-gea-300 text-gea-600 flex justify-center items-center shadow-sm hover:bg-gea-50 transition-all mt-0.5"
        }, /*#__PURE__*/React.createElement(IconPlus, {
          size: 12,
          className: "mr-1"
        }), " weitere")), isOverbooked && /*#__PURE__*/React.createElement("div", {
          className: "absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_4px_rgba(244,63,94,0.5)] z-20"
        }));
      }), rightSpacerSpan > 0 && /*#__PURE__*/React.createElement("td", {
        colSpan: rightSpacerSpan,
        className: "border-b border-r border-slate-300 bg-white"
      }));
    }));
  })))));
};