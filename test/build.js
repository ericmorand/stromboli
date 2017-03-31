const Stromboli = require('../src');
const StromboliComponent = require('../src/lib/component');
const tap = require('tap');
const path = require('path');
const fs = require('fs');
const sinon = require('sinon');

const Plugin = require('./plugins/plugin');

tap.test('build single component', function (t) {
  var stromboli = new Stromboli();

  var component = new StromboliComponent('my-component', 'test/build/single');

  var plugins = [
    {
      name: 'first',
      entry: 'index.first',
      module: new Plugin()
    },
    {
      name: 'second',
      entry: 'index.second',
      module: new Plugin()
    },
    {
      name: 'second-again',
      entry: 'index.second',
      output: 'index-again.second.bin',
      module: new Plugin()
    }
  ];

  return stromboli.buildComponent(component, plugins).then(
    function (component) {
      t.type(component.renderResults, 'Map');
      t.equal(Array.from(component.renderResults.keys()).length, 3);

      var binaries = null;
      let sourceDependencies = null;
      let binaryDependencies = null;

      var firstResult = component.renderResults.get('first');

      sourceDependencies = firstResult.sourceDependencies;

      t.same(sourceDependencies.sort(), [
        path.resolve('test/build/single/index.first'),
        path.resolve('test/build/single/index.first.dep.src')
      ].sort());

      binaryDependencies = firstResult.binaryDependencies;

      t.same(binaryDependencies.sort(), [
        path.resolve('test/build/single/index.first.dep.bin')
      ].sort());

      binaries = firstResult.binaries;

      t.type(binaries, 'Array');
      t.equal(binaries.length, 1);
      t.equal(binaries[0].name, 'index.first.bin');

      var secondResult = component.renderResults.get('second');

      sourceDependencies = secondResult.sourceDependencies;

      t.same(sourceDependencies.sort(), [
        path.resolve('test/build/single/index.second'),
        path.resolve('test/build/single/index.second.dep.src')
      ].sort());

      binaryDependencies = secondResult.binaryDependencies;

      t.same(binaryDependencies.sort(), [
        path.resolve('test/build/single/index.second.dep.bin')
      ].sort());

      binaries = secondResult.binaries;

      t.type(binaries, 'Array');
      t.equal(binaries.length, 1);
      t.equal(binaries[0].name, 'index.second.bin');

      var secondAgainResult = component.renderResults.get('second-again');

      sourceDependencies = secondAgainResult.sourceDependencies;

      t.same(sourceDependencies.sort(), [
        path.resolve('test/build/single/index.second'),
        path.resolve('test/build/single/index.second.dep.src')
      ].sort());

      binaryDependencies = secondAgainResult.binaryDependencies;

      t.same(binaryDependencies.sort(), [
        path.resolve('test/build/single/index.second.dep.bin')
      ].sort());

      binaries = secondAgainResult.binaries;

      t.type(binaries, 'Array');
      t.equal(binaries.length, 1);
      t.equal(binaries[0].name, 'index-again.second.bin');

      t.end();
    },
    function (err) {
      t.fail(err);
    }
  );
});

tap.test('build with error', function (test) {
  let componentPath = 'test/build/single';
  let stromboli = new Stromboli();
  let component = new StromboliComponent('my-component', componentPath);

  stromboli.setLogLevel('warn');

  test.beforeEach(function(done) {
    sinon.stub(stromboli.logger, 'error');

    done();
  });

  test.afterEach(function(done) {
    stromboli.logger.error.restore();

    done();
  });

  let executeTest = function(Plugin, wanted, dependencyCount) {
    return function(subtest) {
      let plugins = [
        {
          name: 'plugin',
          entry: 'index.first',
          module: new Plugin()
        }
      ];

      return stromboli.buildComponent(component, plugins).then(
        function (component) {
          let renderResult = component.renderResults.get('plugin');

          subtest.same(renderResult.error, wanted);
          subtest.same(renderResult.sourceDependencies.length, dependencyCount);
          subtest.equal(stromboli.logger.error.callCount, 1);
        },
        function (err) {
          subtest.fail(err);
        }
      )
    }
  };

  test.plan(3);

  test.test('error as message', executeTest(require('./plugins/error'), 'Dummy error', 0));

  test.test('error with message', executeTest(require('./plugins/error-with-message'), {
      message: 'Dummy error'
  }, 0));

  test.test('error with file', executeTest(require('./plugins/error-with-file'), {
    file: 'bar',
    message: 'Dummy error'
  }, 2));
});